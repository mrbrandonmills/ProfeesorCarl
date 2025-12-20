// ===========================================
// TOKEN REFRESH ENDPOINT
// ===========================================
// Allows clients to refresh their JWT before it expires
// Also handles tokens that expired within the 24h grace period

import { NextRequest, NextResponse } from 'next/server'
import { refreshToken, verifyToken } from '@/lib/auth/jwt'

export async function POST(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value

  if (!token) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 })
  }

  // Try to refresh the token
  const newToken = refreshToken(token)

  if (!newToken) {
    return NextResponse.json({ error: 'Token expired beyond grace period' }, { status: 401 })
  }

  // Get user info from new token for response
  const payload = verifyToken(newToken)

  const response = NextResponse.json({
    success: true,
    message: 'Token refreshed',
    user: payload ? {
      userId: payload.userId,
      email: payload.email,
      role: payload.role
    } : undefined
  })

  // Set the new token as a cookie
  response.cookies.set('auth_token', newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })

  return response
}

// GET: Check if token needs refresh
export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value

  if (!token) {
    return NextResponse.json({
      needsRefresh: false,
      authenticated: false,
      message: 'No token'
    })
  }

  // Verify the token normally (strict)
  const payload = verifyToken(token)

  if (payload) {
    // Token is valid, check if it will expire soon (within 1 day)
    const exp = payload.exp || 0
    const now = Math.floor(Date.now() / 1000)
    const oneDay = 24 * 60 * 60

    return NextResponse.json({
      needsRefresh: (exp - now) < oneDay,
      authenticated: true,
      expiresIn: exp - now,
      user: {
        userId: payload.userId,
        email: payload.email,
        role: payload.role
      }
    })
  }

  // Token is invalid/expired - check if within grace period
  const refreshed = refreshToken(token)

  return NextResponse.json({
    needsRefresh: refreshed !== null,
    authenticated: false,
    canRefresh: refreshed !== null,
    message: refreshed ? 'Token expired but can be refreshed' : 'Token expired beyond grace period'
  })
}
