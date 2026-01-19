import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { supabaseAdmin } from '@/lib/supabase/server'
import { generateSocraticResponse } from '@/lib/ai/claude'
import { detectFrustration } from '@/lib/ai/frustration'
import { getEnvVar } from '@/lib/env'
import { retrieveStudentContext, saveStudentContext } from '@/lib/memory/mcp-client'
import { getUnifiedMemoryContext, formatUnifiedMemoryContextForPrompt } from '@/lib/memory/unified'

export async function POST(request: NextRequest) {
  try {
    // Validate required env vars
    try {
      getEnvVar('ANTHROPIC_API_KEY')
      getEnvVar('SUPABASE_SERVICE_ROLE_KEY')
    } catch (envError) {
      return NextResponse.json(
        {
          error: 'Server configuration error',
          message: envError instanceof Error ? envError.message : 'Missing environment variables'
        },
        { status: 500 }
      )
    }

    // Parse body first to check for demo mode
    const { message, sessionId, voiceStyle, lessonContext, demoContext } = await request.json()

    // Check for auth token (cookies first, then Authorization header for mobile)
    let token = request.cookies.get('auth_token')?.value
    if (!token) {
      const authHeader = request.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }
    }

    // Determine userId based on auth state
    let userId: string
    const isExplicitDemo = demoContext?.isDemo
    const isGuestToken = token?.startsWith('guest-token-')
    const isDemoToken = token?.startsWith('demo-token-') || token?.startsWith('local-token-')

    if (isExplicitDemo || isGuestToken || isDemoToken) {
      // Demo/guest mode - use identifier from token or generate one
      if (isGuestToken || isDemoToken) {
        userId = token!.replace('guest-token-', '').replace('demo-token-', '').replace('local-token-', '')
      } else {
        userId = 'demo-user-' + (sessionId?.slice(0, 8) || 'default')
      }
      console.log('[Chat] Demo/guest mode, userId:', userId)
    } else if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    } else {
      // Normal auth flow - verify JWT
      const payload = verifyToken(token)
      if (!payload) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
      userId = payload.userId
      console.log('[Chat] Authenticated user:', userId)
    }

    // Get session and conversation history
    // Sessions may be client-generated (for demo/guest users) and not exist in DB
    const { data: session } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    // If no session in DB, create a virtual session for demo/guest mode
    const effectiveSession = session || {
      id: sessionId,
      student_id: userId,
      course_id: 'general',
      topics_covered: [],
      frustration_level: 0
    }

    const { data: messages } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true })

    const conversationHistory = messages || []

    // Retrieve student context from MCP Memory (ephemeral session context)
    const studentContext = await retrieveStudentContext(userId)

    // Retrieve unified memories from PostgreSQL (Carl + ANCHOR)
    const currentTopic = message.substring(0, 100) // Use message start as topic hint
    const recentContext = conversationHistory.slice(-5).map((m: any) => m.content)
    const unifiedMemories = await getUnifiedMemoryContext(userId, currentTopic, 10, recentContext)
    const memoryContextStr = formatUnifiedMemoryContextForPrompt(unifiedMemories)

    // Add both contexts to conversation history for Claude
    const contextParts: string[] = []
    if (memoryContextStr) {
      contextParts.push(memoryContextStr)
    }
    if (studentContext) {
      contextParts.push(`\n## Current Session:\nTopics explored: ${studentContext.topics_explored.join(', ')}. Current understanding: ${studentContext.current_understanding}. Progress: ${studentContext.learning_progress}.`)
    }

    const enrichedHistory = contextParts.length > 0
      ? [
          {
            role: 'assistant',
            content: `[Memory Context]\n${contextParts.join('\n')}`,
          },
          ...conversationHistory,
        ]
      : conversationHistory

    // Detect frustration
    const frustrationLevel = detectFrustration(message)

    // Count user attempts in this session
    const attemptCount = conversationHistory.filter((m) => m.role === 'user').length + 1

    // Generate Socratic response with voice personality and demo context
    const response = await generateSocraticResponse(message, enrichedHistory, {
      attemptCount,
      frustrationLevel,
      topic: effectiveSession.topics_covered[effectiveSession.topics_covered.length - 1],
      voiceStyle: voiceStyle || 'alloy', // Default to alloy if not provided
      lessonContext: lessonContext || null, // Pass lesson context if available
      demoContext: demoContext || null, // Pass demo context if in demo mode
    })

    // Save messages to database (may fail for demo/guest sessions - non-fatal)
    try {
      await supabaseAdmin.from('messages').insert({
        session_id: sessionId,
        role: 'user',
        content: message,
      })
      await supabaseAdmin.from('messages').insert({
        session_id: sessionId,
        role: 'assistant',
        content: response,
      })
      // Update session frustration level (only if session exists in DB)
      if (session) {
        await supabaseAdmin
          .from('sessions')
          .update({
            frustration_level: Math.max(effectiveSession.frustration_level, frustrationLevel),
          })
          .eq('id', sessionId)
      }
    } catch (dbError) {
      // Non-fatal for demo/guest sessions
      console.log('[Chat] DB save skipped (demo/guest mode):', dbError instanceof Error ? dbError.message : 'Unknown')
    }

    // Update student context in MCP Memory
    try {
      const updatedTopics = effectiveSession.topics_covered || []
      const currentTopic = updatedTopics[updatedTopics.length - 1] || 'General learning'

      await saveStudentContext(userId, {
        topics_explored: updatedTopics,
        current_understanding: `Currently working on: ${currentTopic}. Frustration level: ${frustrationLevel}/10.`,
        learning_progress: `Session ${sessionId}: ${attemptCount} attempts. Recent engagement with topic.`,
        conversation_summary: `Last message: ${message.substring(0, 100)}... Response generated successfully.`,
      })
    } catch (memoryError) {
      console.error('Failed to save student context:', memoryError)
      // Don't fail the request if memory save fails
    }

    // Call memory feedback API if we retrieved memories
    if (unifiedMemories.retrievedMemoryIds.length > 0) {
      // Simple heuristic: if response mentions something from memory, it was cited
      const citedIds = unifiedMemories.userFacts
        .filter(f => response.toLowerCase().includes(f.fact.toLowerCase().substring(0, 20)))
        .map(f => f.id)
        .filter(Boolean)

      // Fire-and-forget feedback call (don't block response)
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/memory/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userId,
          retrievedMemoryIds: unifiedMemories.retrievedMemoryIds,
          citedMemoryIds: citedIds
        })
      }).catch(err => console.error('[Chat] Memory feedback error:', err))
    }

    return NextResponse.json({ response, frustrationLevel })
  } catch (error) {
    console.error('[Chat] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : ''
    console.error('[Chat] Stack:', errorStack)
    return NextResponse.json({
      error: 'Failed to generate response',
      ...(process.env.NODE_ENV === 'development' && { debug: errorMessage })
    }, { status: 500 })
  }
}
