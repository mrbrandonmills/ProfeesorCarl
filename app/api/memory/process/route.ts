/**
 * POST /api/memory/process
 * Process a completed conversation and extract memories
 * Call this at the end of chat or voice sessions
 */

import { NextRequest, NextResponse } from 'next/server'
import { saveConversationMemories } from '@/lib/memory/save-conversation-memory'
import { verifyToken } from '@/lib/auth/jwt'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      sessionId,
      messages,
      sessionData,
      demoContext,
    } = body

    // Handle demo mode
    let effectiveUserId = userId
    if (demoContext?.isDemo && !userId) {
      effectiveUserId = 'demo-user-' + (sessionId?.slice(0, 8) || 'default')
    } else if (!userId) {
      // Try to get from auth token
      const token = request.cookies.get('auth_token')?.value
      if (token) {
        const payload = verifyToken(token)
        if (payload) {
          effectiveUserId = payload.userId
        }
      }
    }

    if (!effectiveUserId) {
      return NextResponse.json(
        { error: 'userId required' },
        { status: 400 }
      )
    }

    if (!sessionId || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'sessionId and messages array required' },
        { status: 400 }
      )
    }

    console.log(`[Memory Process] Processing ${messages.length} messages for user ${effectiveUserId}`)

    const result = await saveConversationMemories(
      effectiveUserId,
      sessionId,
      messages,
      sessionData
    )

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('[Memory Process] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Processing failed' },
      { status: 500 }
    )
  }
}
