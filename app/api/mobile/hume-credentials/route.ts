import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'

/**
 * Mobile Hume Credentials Endpoint
 * Returns Hume API key and config ID for authenticated mobile users
 * This is secure because:
 * 1. Requires valid JWT token
 * 2. Only returns what's needed for EVI connection
 */

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)

    // Check for guest/demo tokens (allow for testing, but log warning)
    const isGuestToken = token.startsWith('guest-token-')
    const isDemoToken = token.startsWith('demo-token-') || token.startsWith('local-token-')

    let userId: string
    if (isGuestToken || isDemoToken) {
      // Allow guest/demo tokens for testing voice
      userId = token.replace('guest-token-', '').replace('demo-token-', '').replace('local-token-', '')
      console.log('[Mobile Hume] Guest/demo access:', userId)
    } else {
      const payload = verifyToken(token)
      if (!payload) {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        )
      }
      userId = payload.userId
    }

    // Get Hume credentials from environment
    // CRITICAL: Trim whitespace/newlines from env var (Vercel sometimes adds them)
    const humeApiKey = process.env.HUME_API_KEY?.trim()
    // Use UCSD Final config - British voice + Sonnet 4 (same as web version)
    const humeConfigId = process.env.HUME_CONFIG_ID || '52b75fbf-732c-48fe-af7e-5aae177e8136'

    if (!humeApiKey) {
      console.error('[Mobile Hume] HUME_API_KEY not configured in environment')
      return NextResponse.json(
        { error: 'Hume API not configured on server' },
        { status: 500 }
      )
    }

    console.log('[Mobile Hume] Credentials requested by user:', userId)

    return NextResponse.json({
      success: true,
      apiKey: humeApiKey,
      configId: humeConfigId,
      websocketUrl: 'wss://api.hume.ai/v0/evi/chat',
    })

  } catch (error) {
    console.error('[Mobile Hume] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get Hume credentials' },
      { status: 500 }
    )
  }
}
