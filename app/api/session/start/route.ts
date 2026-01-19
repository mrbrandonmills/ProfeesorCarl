import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Check cookies first, then Authorization header (mobile sends header)
    let token = request.cookies.get('auth_token')?.value
    if (!token) {
      const authHeader = request.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }
    }

    // Determine userId based on auth state
    let userId: string
    const isGuestToken = token?.startsWith('guest-token-')
    const isDemoToken = token?.startsWith('demo-token-') || token?.startsWith('local-token-')

    if (isGuestToken || isDemoToken) {
      // Demo/guest mode - extract ID from token prefix
      userId = token!.replace('guest-token-', '').replace('demo-token-', '').replace('local-token-', '')
      console.log('[Session] Demo/guest mode, userId:', userId)
    } else if (token) {
      // Try to verify JWT
      const payload = verifyToken(token)
      userId = payload?.userId || '00000000-0000-0000-0000-000000000000'
      console.log('[Session] Auth userId:', userId)
    } else {
      // Anonymous session
      userId = '00000000-0000-0000-0000-000000000000'
    }

    // Try to create session in database
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
      console.error('[Session] Database error:', error.message, error.code)
      // For demo/guest users, generate a client-side session ID if DB fails
      // This happens when user doesn't exist in users table (FK constraint)
      const clientSessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
      console.log('[Session] Using client-generated session ID:', clientSessionId)
      return NextResponse.json({ sessionId: clientSessionId, isClientSession: true })
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
