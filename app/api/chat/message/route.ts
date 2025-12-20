import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { supabaseAdmin } from '@/lib/supabase/server'
import { generateSocraticResponse } from '@/lib/ai/claude'
import { detectFrustration } from '@/lib/ai/frustration'
import { getEnvVar } from '@/lib/env'
import { retrieveStudentContext, saveStudentContext } from '@/lib/memory/mcp-client'
import { retrieveMemoryContext, formatMemoryContextForPrompt } from '@/lib/memory/retrieval'

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

    // Demo mode bypass - allow unauthenticated demo sessions
    let userId: string
    if (demoContext?.isDemo) {
      // Use demo user ID based on session
      userId = 'demo-user-' + (sessionId?.slice(0, 8) || 'default')
      console.log('[Chat] Demo mode active, using demo userId:', userId)
    } else {
      // Normal auth flow - require JWT
      const token = request.cookies.get('auth_token')?.value
      if (!token) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
      }

      const payload = verifyToken(token)
      if (!payload) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
      userId = payload.userId
    }

    // Get session and conversation history
    const { data: session } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const { data: messages } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true })

    const conversationHistory = messages || []

    // Retrieve student context from MCP Memory (ephemeral session context)
    const studentContext = await retrieveStudentContext(userId)

    // Retrieve permanent memories from PostgreSQL (Brandon's facts, Carl's notes)
    const currentTopic = message.substring(0, 100) // Use message start as topic hint
    const permanentMemories = await retrieveMemoryContext(userId, currentTopic, 10)
    const memoryContextStr = formatMemoryContextForPrompt(permanentMemories)

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
      topic: session.topics_covered[session.topics_covered.length - 1],
      voiceStyle: voiceStyle || 'alloy', // Default to alloy if not provided
      lessonContext: lessonContext || null, // Pass lesson context if available
      demoContext: demoContext || null, // Pass demo context if in demo mode
    })

    // Save user message
    await supabaseAdmin.from('messages').insert({
      session_id: sessionId,
      role: 'user',
      content: message,
    })

    // Save assistant response
    await supabaseAdmin.from('messages').insert({
      session_id: sessionId,
      role: 'assistant',
      content: response,
    })

    // Update session frustration level
    await supabaseAdmin
      .from('sessions')
      .update({
        frustration_level: Math.max(session.frustration_level, frustrationLevel),
      })
      .eq('id', sessionId)

    // Update student context in MCP Memory
    try {
      const updatedTopics = session.topics_covered || []
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
    if (permanentMemories.retrievedMemoryIds.length > 0) {
      // Simple heuristic: if response mentions something from memory, it was cited
      const citedIds = permanentMemories.userFacts
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
          retrievedMemoryIds: permanentMemories.retrievedMemoryIds,
          citedMemoryIds: citedIds
        })
      }).catch(err => console.error('[Chat] Memory feedback error:', err))
    }

    return NextResponse.json({ response, frustrationLevel })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 })
  }
}
