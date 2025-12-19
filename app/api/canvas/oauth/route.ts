import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, signToken } from '@/lib/auth/jwt'
import { getCanvasAuthUrl, hasCanvasToken } from '@/lib/canvas/oauth'

/**
 * GET /api/canvas/oauth
 * Initiates the Canvas OAuth flow
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check if user already has Canvas connected
    const hasCanvas = await hasCanvasToken(payload.userId)
    if (hasCanvas) {
      return NextResponse.json({
        connected: true,
        message: 'Canvas is already connected',
      })
    }

    // Build redirect URI
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const redirectUri = `${appUrl}/api/canvas/oauth/callback`

    // Use a short-lived JWT as state for security
    // This contains the user ID so we know who to associate the token with
    const state = signToken({
      userId: payload.userId,
      purpose: 'canvas_oauth',
    })

    // Generate Canvas auth URL
    const authUrl = getCanvasAuthUrl(redirectUri, state)

    return NextResponse.json({
      connected: false,
      authUrl,
    })
  } catch (error) {
    console.error('[Canvas OAuth] Error:', error)

    // Check if Canvas is not configured
    if (error instanceof Error && error.message.includes('not configured')) {
      return NextResponse.json({
        error: 'Canvas integration not configured',
        message: 'Canvas OAuth credentials are not set. Contact administrator.',
      }, { status: 503 })
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'OAuth initiation failed' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/canvas/oauth
 * Disconnects Canvas for the current user
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Import deleteCanvasToken dynamically to avoid issues if table doesn't exist
    const { deleteCanvasToken } = await import('@/lib/canvas/oauth')
    await deleteCanvasToken(payload.userId)

    return NextResponse.json({
      success: true,
      message: 'Canvas disconnected',
    })
  } catch (error) {
    console.error('[Canvas OAuth] Disconnect error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Disconnect failed' },
      { status: 500 }
    )
  }
}
