import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { parseLTIRoles, validateLTIRequest } from '@/lib/auth/lti'
import { signToken } from '@/lib/auth/jwt'

export async function POST(request: NextRequest) {
  try {
    // Validate LTI request
    const ltiData = validateLTIRequest(request)

    if (!ltiData) {
      return NextResponse.json({ error: 'Invalid LTI request' }, { status: 400 })
    }

    const role = parseLTIRoles(ltiData.roles)

    // Check if user exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('canvas_id', ltiData.canvas_user_id)
      .single()

    let user

    if (existingUser) {
      // Update existing user
      const { data: updatedUser, error } = await supabaseAdmin
        .from('users')
        .update({
          name: ltiData.name,
          email: ltiData.email,
          role,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingUser.id)
        .select()
        .single()

      if (error) throw error
      user = updatedUser
    } else {
      // Create new user
      const { data: newUser, error } = await supabaseAdmin
        .from('users')
        .insert({
          canvas_id: ltiData.canvas_user_id,
          name: ltiData.name,
          email: ltiData.email,
          role,
        })
        .select()
        .single()

      if (error) throw error
      user = newUser
    }

    // Generate JWT
    const token = signToken({
      userId: user.id,
      role: user.role,
      courseId: ltiData.course_id,
    })

    // Set cookie and redirect
    const response = NextResponse.redirect(
      new URL(role === 'teacher' ? '/dashboard' : '/chat', request.url)
    )

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    console.error('LTI auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}
