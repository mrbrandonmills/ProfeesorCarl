import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { supabaseAdmin } from '@/lib/supabase/server'
import { generateSocraticResponse } from '@/lib/ai/claude'
import { detectFrustration } from '@/lib/ai/frustration'

export async function POST(request: NextRequest) {
  try {
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

    // Detect frustration
    const frustrationLevel = detectFrustration(message)

    // Count user attempts in this session
    const attemptCount = conversationHistory.filter((m) => m.role === 'user').length + 1

    // Generate Socratic response
    const response = await generateSocraticResponse(message, conversationHistory, {
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

    return NextResponse.json({ response, frustrationLevel })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 })
  }
}
