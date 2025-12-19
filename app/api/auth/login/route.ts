import { NextRequest, NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
import { queryOne } from '@/lib/db/postgres'
import { signToken } from '@/lib/auth/jwt'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await queryOne(`
      SELECT id, name, email, role, password_hash
      FROM users
      WHERE email = $1
    `, [email.toLowerCase()])

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if user has a password (registered users)
    if (!user.password_hash) {
      // User exists but has no password (mock/demo user)
      // Fall back to accepting any password for backwards compatibility
      console.log('[Login] User without password_hash, allowing login:', email)
    } else {
      // Verify password
      const passwordValid = await compare(password, user.password_hash)
      if (!passwordValid) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }
    }

    // Generate JWT token
    const token = signToken({
      userId: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
    })

    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })

    // Set auth cookie (7 days)
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    console.log('[Login] User logged in:', user.email)

    return response
  } catch (error) {
    console.error('[Login] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Login failed' },
      { status: 500 }
    )
  }
}
