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
    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Get Hume credentials from environment
    const humeApiKey = process.env.HUME_API_KEY
    // Use UCSD Final config - British voice + Sonnet 4 (same as web version)
    const humeConfigId = process.env.HUME_CONFIG_ID || '52b75fbf-732c-48fe-af7e-5aae177e8136'

    if (!humeApiKey) {
      console.error('[Mobile Hume] HUME_API_KEY not configured in environment')
      return NextResponse.json(
        { error: 'Hume API not configured on server' },
        { status: 500 }
      )
    }

    console.log('[Mobile Hume] Credentials requested by user:', payload.userId)

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
