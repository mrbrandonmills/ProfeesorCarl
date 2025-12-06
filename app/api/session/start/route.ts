import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value

    // For now, allow unauthenticated sessions for demo purposes
    // In production, you'd require authentication
    const userId = token ? verifyToken(token)?.userId : '00000000-0000-0000-0000-000000000000'

    const { data, error } = await supabaseAdmin
      .from('sessions')
      .insert({
        student_id: userId,
        course_id: 'general',
        topics_covered: [],
        frustration_level: 0
      })
      .select()
      .single()

    if (error) {
      console.error('Session creation error:', error)
      throw error
    }

    return NextResponse.json({ sessionId: data.id })
  } catch (error) {
    console.error('Session creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}
