import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { supabaseAdmin } from '@/lib/supabase/server'
import { generateSocraticResponse } from '@/lib/ai/claude'
import { detectFrustration } from '@/lib/ai/frustration'
import { getEnvVar } from '@/lib/env'
import { retrieveStudentContext, saveStudentContext } from '@/lib/memory/mcp-client'

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

    const token = request.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { message, sessionId } = await request.json()

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

    // Retrieve student context from MCP Memory
    const studentContext = await retrieveStudentContext(payload.userId)

    // Add student context to conversation history for Claude
    const enrichedHistory = studentContext
      ? [
          {
            role: 'assistant',
            content: `[Student Context] Topics explored: ${studentContext.topics_explored.join(', ')}. Current understanding: ${studentContext.current_understanding}. Progress: ${studentContext.learning_progress}.`,
          },
          ...conversationHistory,
        ]
      : conversationHistory

    // Detect frustration
    const frustrationLevel = detectFrustration(message)

    // Count user attempts in this session
    const attemptCount = conversationHistory.filter((m) => m.role === 'user').length + 1

    // Generate Socratic response
    const response = await generateSocraticResponse(message, enrichedHistory, {
      attemptCount,
      frustrationLevel,
      topic: session.topics_covered[session.topics_covered.length - 1],
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

      await saveStudentContext(payload.userId, {
        topics_explored: updatedTopics,
        current_understanding: `Currently working on: ${currentTopic}. Frustration level: ${frustrationLevel}/10.`,
        learning_progress: `Session ${sessionId}: ${attemptCount} attempts. Recent engagement with topic.`,
        conversation_summary: `Last message: ${message.substring(0, 100)}... Response generated successfully.`,
      })
    } catch (memoryError) {
      console.error('Failed to save student context:', memoryError)
      // Don't fail the request if memory save fails
    }

    return NextResponse.json({ response, frustrationLevel })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 })
  }
}
