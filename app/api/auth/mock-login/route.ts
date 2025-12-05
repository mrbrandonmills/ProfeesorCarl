import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { signToken } from '@/lib/auth/jwt'

// Mock users for demo purposes
const MOCK_USERS = {
  professor: {
    canvas_id: 'prof_demo_001',
    name: 'Dr. Sarah Chen',
    email: 'professor@university.edu',
    role: 'teacher' as const,
  },
  student: {
    canvas_id: 'student_demo_001',
    name: 'Alex Martinez',
    email: 'student@university.edu',
    role: 'student' as const,
  },
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, role } = await request.json()

    // In demo mode, any password works
    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      )
    }

    // Get or create mock user
    const mockUser = role === 'professor' ? MOCK_USERS.professor : MOCK_USERS.student

    // Check if user exists in database
    let { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('canvas_id', mockUser.canvas_id)
      .single()

    // Create user if doesn't exist
    if (!existingUser) {
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          canvas_id: mockUser.canvas_id,
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role,
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating user:', createError)
        return NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 }
        )
      }

      existingUser = newUser
    }

    // Generate JWT token
    const token = signToken({
      userId: existingUser.id,
      role: existingUser.role,
      name: existingUser.name,
      email: existingUser.email,
    })

    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role,
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

    return response
  } catch (error) {
    console.error('Mock login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}
