// ===========================================
// SESSION END API
// ===========================================
// Save session reports and emotional analytics to database

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

interface SessionReport {
  duration?: number
  messageCount?: number
  overallEngagement?: number
  emotionSummary?: {
    averageConfidence?: number
    averageEngagement?: number
    averageConfusion?: number
    averageNervousness?: number
    peakMoments?: string[]
  }
  topicsDiscussed?: string[]
  keyInsights?: string[]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, userId, report, isDemo, timestamp } = body

    if (!sessionId || !userId) {
      return NextResponse.json(
        { error: 'Session ID and user ID are required' },
        { status: 400 }
      )
    }

    const sessionReport = report as SessionReport

    // Prepare session data for storage
    const sessionData = {
      session_id: sessionId,
      user_id: userId,
      duration: sessionReport.duration || 0,
      message_count: sessionReport.messageCount || 0,
      overall_engagement: sessionReport.overallEngagement || 0,
      emotion_data: sessionReport.emotionSummary || {},
      topics_explored: sessionReport.topicsDiscussed || [],
      insights_gained: sessionReport.keyInsights?.length || 0,
      is_demo: isDemo || false,
      created_at: timestamp || new Date().toISOString(),
    }

    console.log('[Session End] Saving session:', sessionId, 'for user:', userId)

    // Try to save to Supabase
    const { data, error } = await supabaseAdmin
      .from('session_summaries')
      .insert(sessionData)
      .select()
      .single()

    if (error) {
      // If table doesn't exist, log but don't fail
      console.error('[Session End] Database error:', error.message)

      // Still return success for demo purposes - the session data was logged
      return NextResponse.json({
        success: true,
        saved: false,
        reason: 'Database table may not exist yet',
        sessionId,
        reportSummary: {
          duration: sessionData.duration,
          engagement: sessionData.overall_engagement,
          topicsCount: sessionData.topics_explored.length,
        }
      })
    }

    console.log('[Session End] Session saved successfully:', data?.id || sessionId)

    return NextResponse.json({
      success: true,
      saved: true,
      sessionId: data?.id || sessionId,
      reportSummary: {
        duration: sessionData.duration,
        engagement: sessionData.overall_engagement,
        topicsCount: sessionData.topics_explored.length,
      }
    })

  } catch (error) {
    console.error('[Session End] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save session'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve sessions for a user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const { data: sessions, error } = await supabaseAdmin
      .from('session_summaries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[Session End] Fetch error:', error.message)
      return NextResponse.json({
        success: true,
        sessions: [],
        reason: 'No sessions found or table does not exist'
      })
    }

    return NextResponse.json({
      success: true,
      sessions: sessions || [],
      count: sessions?.length || 0
    })

  } catch (error) {
    console.error('[Session End] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}
