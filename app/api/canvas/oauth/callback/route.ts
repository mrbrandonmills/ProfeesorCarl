import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { exchangeCodeForToken, storeCanvasToken } from '@/lib/canvas/oauth'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    // Handle OAuth errors
    if (error) {
      console.error('[Canvas OAuth] Error:', error, errorDescription)
      return NextResponse.redirect(
        new URL(`/professor/dashboard?canvas_error=${encodeURIComponent(errorDescription || error)}`, request.url)
      )
    }

    // Validate code and state
    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/professor/dashboard?canvas_error=missing_params', request.url)
      )
    }

    // Verify state contains valid user info (state = JWT token)
    const payload = verifyToken(state)
    if (!payload || !payload.userId) {
      return NextResponse.redirect(
        new URL('/professor/dashboard?canvas_error=invalid_state', request.url)
      )
    }

    // Build redirect URI (must match what was sent in auth request)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const redirectUri = `${appUrl}/api/canvas/oauth/callback`

    // Exchange code for token
    const token = await exchangeCodeForToken(code, redirectUri)

    // Store token for user
    await storeCanvasToken(payload.userId, token)

    console.log('[Canvas OAuth] Successfully connected for user:', payload.userId)

    // Redirect to dashboard with success message
    return NextResponse.redirect(
      new URL('/professor/dashboard?canvas=connected', request.url)
    )
  } catch (error) {
    console.error('[Canvas OAuth] Callback error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.redirect(
      new URL(`/professor/dashboard?canvas_error=${encodeURIComponent(errorMessage)}`, request.url)
    )
  }
}
