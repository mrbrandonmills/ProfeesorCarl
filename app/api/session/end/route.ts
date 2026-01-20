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

    // Prepare session data for voice_sessions table (memory-schema.sql)
    const sessionData = {
      id: sessionId,
      user_id: userId,
      duration_seconds: sessionReport.duration || 0,
      average_engagement: sessionReport.emotionSummary?.averageEngagement || sessionReport.overallEngagement || 0,
      average_confidence: sessionReport.emotionSummary?.averageConfidence || 0,
      breakthrough_count: sessionReport.emotionSummary?.peakMoments?.length || 0,
      confusion_moments: Math.round((sessionReport.emotionSummary?.averageConfusion || 0) * 10),
      topics_explored: sessionReport.topicsDiscussed || [],
      main_topic: sessionReport.topicsDiscussed?.[0] || null,
      overall_quality_score: sessionReport.overallEngagement || 0,
      session_report: {
        messageCount: sessionReport.messageCount,
        emotionSummary: sessionReport.emotionSummary,
        keyInsights: sessionReport.keyInsights,
        isDemo: isDemo,
      },
      ended_at: timestamp || new Date().toISOString(),
    }

    console.log('[Session End] Saving session:', sessionId, 'for user:', userId)

    // Try to save to voice_sessions table (from memory-schema.sql)
    const { data, error } = await supabaseAdmin
      .from('voice_sessions')
      .upsert(sessionData, { onConflict: 'id' })
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
          duration: sessionData.duration_seconds,
          engagement: sessionData.overall_quality_score,
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
        duration: sessionData.duration_seconds,
        engagement: sessionData.overall_quality_score,
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
      .from('voice_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
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
