// ===========================================
// API ROUTE: /api/voice-session
// ===========================================
// Handles starting, ending, and monitoring voice learning sessions

import { NextRequest, NextResponse } from 'next/server'
import { VoiceLearningSession } from '@/lib/voice-training/session-manager'
import type { BrandonContext } from '@/lib/voice-training/types'

// In-memory session store (use Redis in production)
const activeSessions = new Map<string, VoiceLearningSession>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, sessionId, userId, context } = body

    console.log(`[API] Voice session action: ${action}`)

    switch (action) {
      // ========== START SESSION ==========
      case 'start': {
        if (!userId) {
          return NextResponse.json(
            { error: 'Missing required field: userId' },
            { status: 400 }
          )
        }

        // Build Brandon context from request
        const brandonContext: BrandonContext = {
          isDemo: context?.isDemo || false,
          presentationMode: context?.presentationMode || false,
          neurodivergenceAwareness: true,
          reverseEngineeringApproach: true,
          aiCollaborationHistory: true,
          currentTopic: context?.currentTopic,
        }

        const session = new VoiceLearningSession()
        const result = await session.start(userId, brandonContext)

        if (!result.success) {
          return NextResponse.json(
            { error: 'Failed to start voice session' },
            { status: 500 }
          )
        }

        activeSessions.set(result.sessionId, session)

        return NextResponse.json({
          success: true,
          sessionId: result.sessionId,
          message: 'Voice session started. Speak with Professor Carl.',
        })
      }

      // ========== END SESSION ==========
      case 'end': {
        if (!sessionId) {
          return NextResponse.json(
            { error: 'Missing sessionId' },
            { status: 400 }
          )
        }

        const session = activeSessions.get(sessionId)
        if (!session) {
          return NextResponse.json(
            { error: 'Session not found or already ended' },
            { status: 404 }
          )
        }

        const report = await session.end()
        activeSessions.delete(sessionId)

        return NextResponse.json({ success: true, report })
      }

      // ========== CHECK STATUS ==========
      case 'status': {
        if (!sessionId) {
          return NextResponse.json(
            { error: 'Missing sessionId' },
            { status: 400 }
          )
        }

        const session = activeSessions.get(sessionId)
        if (!session) {
          return NextResponse.json({
            success: true,
            exists: false,
            active: false,
          })
        }

        return NextResponse.json({
          success: true,
          exists: true,
          active: session.isSessionActive(),
          state: session.getSessionState(),
          emotions: session.getLastEmotions(),
        })
      }

      // ========== UPDATE CONTEXT ==========
      case 'updateContext': {
        if (!sessionId) {
          return NextResponse.json(
            { error: 'Missing sessionId' },
            { status: 400 }
          )
        }

        const session = activeSessions.get(sessionId)
        if (!session) {
          return NextResponse.json(
            { error: 'Session not found' },
            { status: 404 }
          )
        }

        session.updateContext(context || {})

        return NextResponse.json({
          success: true,
          message: 'Context updated',
        })
      }

      // ========== LIST ACTIVE SESSIONS ==========
      case 'list': {
        const sessions = Array.from(activeSessions.entries()).map(([id, session]) => ({
          id,
          active: session.isSessionActive(),
          state: session.getSessionState(),
        }))

        return NextResponse.json({ success: true, sessions })
      }

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('[API] Voice session error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

// GET endpoint for quick status checks
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('sessionId')

  if (!sessionId) {
    // Return count of active sessions
    return NextResponse.json({
      activeSessions: activeSessions.size,
      sessionIds: Array.from(activeSessions.keys()),
    })
  }

  const session = activeSessions.get(sessionId)

  return NextResponse.json({
    exists: !!session,
    active: session?.isSessionActive() || false,
    emotions: session?.getLastEmotions() || null,
  })
}
