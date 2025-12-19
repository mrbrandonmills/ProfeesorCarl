import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { query, queryOne, execute } from '@/lib/db/postgres'
import { signToken } from '@/lib/auth/jwt'

// Ensure password_hash column exists
async function ensurePasswordColumn(): Promise<void> {
  try {
    await execute(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS password_hash TEXT
    `)
  } catch (error) {
    // Column might already exist, ignore error
    console.log('[Register] Password column check:', error)
  }
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role } = await request.json()

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Name, email, password, and role are required' },
        { status: 400 }
      )
    }

    // Validate email format
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength (at least 8 characters)
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ['student', 'teacher']
    const userRole = role === 'professor' ? 'teacher' : role
    if (!validRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Role must be student or teacher' },
        { status: 400 }
      )
    }

    // Ensure password column exists
    await ensurePasswordColumn()

    // Check if email already exists
    const existingUser = await queryOne(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    )

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await hash(password, 12)

    // Create user (schema may or may not have canvas_id - try without first)
    let newUser = null
    try {
      newUser = await queryOne(`
        INSERT INTO users (name, email, role, password_hash)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, email, role
      `, [name.trim(), email.toLowerCase(), userRole, passwordHash])
    } catch (insertError: any) {
      // If password_hash column doesn't exist, create user without it
      // and the password won't be stored (user can login via mock-login)
      if (insertError.message?.includes('password_hash')) {
        newUser = await queryOne(`
          INSERT INTO users (name, email, role)
          VALUES ($1, $2, $3)
          RETURNING id, name, email, role
        `, [name.trim(), email.toLowerCase(), userRole])
        console.log('[Register] Note: password_hash column not available, user created without password')
      } else {
        throw insertError
      }
    }

    if (!newUser) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Generate JWT token
    const token = signToken({
      userId: newUser.id,
      role: newUser.role,
      name: newUser.name,
      email: newUser.email,
    })

    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
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

    console.log('[Register] New user created:', newUser.email)

    return response
  } catch (error) {
    console.error('[Register] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Registration failed' },
      { status: 500 }
    )
  }
}
