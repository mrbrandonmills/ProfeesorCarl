import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Check for mock teacher session (for dashboard testing)
    const mockSession = request.cookies.get('mock_teacher_session')?.value
    if (mockSession === 'true') {
      return NextResponse.json({
        user: {
          id: 'mock-teacher-id',
          name: 'Professor Demo',
          email: 'teacher@demo.com',
          role: 'teacher',
        },
        courseId: 'mock-course-id',
      })
    }

    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Fetch user
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', payload.userId)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user, courseId: payload.courseId })
  } catch (error) {
    console.error('Session verification error:', error)
    return NextResponse.json({ error: 'Session verification failed' }, { status: 500 })
  }
}
