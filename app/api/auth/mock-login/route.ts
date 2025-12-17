import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { signToken } from '@/lib/auth/jwt'

// Default mock users for demo purposes
const DEFAULT_USERS = {
  professor: {
    name: 'Dr. Sarah Chen',
    email: 'professor@university.edu',
  },
  student: {
    name: 'Alex Martinez',
    email: 'student@university.edu',
  },
}

// Generate a canvas_id from email (for unique identification)
function generateCanvasId(email: string): string {
  return `demo_${email.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`
}

// Extract a display name from email if no name provided
function extractNameFromEmail(email: string): string {
  const localPart = email.split('@')[0]
  return localPart
    .replace(/[._-]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, role, name: providedName } = await request.json()

    // In demo mode, any password works
    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      )
    }

    // Determine user details - use provided name, or defaults, or extract from email
    const isDefaultProfessor = email === DEFAULT_USERS.professor.email
    const isDefaultStudent = email === DEFAULT_USERS.student.email

    let userName: string
    if (providedName) {
      userName = providedName
    } else if (isDefaultProfessor) {
      userName = DEFAULT_USERS.professor.name
    } else if (isDefaultStudent) {
      userName = DEFAULT_USERS.student.name
    } else {
      userName = extractNameFromEmail(email)
    }

    const canvasId = generateCanvasId(email)
    const userRole = role === 'professor' ? 'teacher' : 'student'

    // Check if user exists in database
    let { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('canvas_id', canvasId)
      .single()

    // Create user if doesn't exist
    if (!existingUser) {
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          canvas_id: canvasId,
          name: userName,
          email: email,
          role: userRole,
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
