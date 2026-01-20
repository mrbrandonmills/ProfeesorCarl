// ===========================================
// SESSION END API
// ===========================================
// Save session reports and emotional analytics to database

import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/postgres'

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

    // Try to save to voice_sessions table using PostgreSQL
    try {
      await query(`
        INSERT INTO voice_sessions (
          id, user_id, duration_seconds, average_engagement, average_confidence,
          breakthrough_count, confusion_moments, topics_explored, main_topic,
          overall_quality_score, session_report, ended_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          duration_seconds = EXCLUDED.duration_seconds,
          average_engagement = EXCLUDED.average_engagement,
          average_confidence = EXCLUDED.average_confidence,
          breakthrough_count = EXCLUDED.breakthrough_count,
          confusion_moments = EXCLUDED.confusion_moments,
          topics_explored = EXCLUDED.topics_explored,
          main_topic = EXCLUDED.main_topic,
          overall_quality_score = EXCLUDED.overall_quality_score,
          session_report = EXCLUDED.session_report,
          ended_at = EXCLUDED.ended_at
      `, [
        sessionData.id,
        sessionData.user_id,
        sessionData.duration_seconds,
        sessionData.average_engagement,
        sessionData.average_confidence,
        sessionData.breakthrough_count,
        sessionData.confusion_moments,
        sessionData.topics_explored,
        sessionData.main_topic,
        sessionData.overall_quality_score,
        JSON.stringify(sessionData.session_report),
        sessionData.ended_at
      ])

      console.log('[Session End] Session saved successfully:', sessionId)
    } catch (dbError) {
      // If table doesn't exist, log but don't fail
      console.error('[Session End] Database error:', dbError)

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

    return NextResponse.json({
      success: true,
      saved: true,
      sessionId,
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

    try {
      const sessions = await query(`
        SELECT * FROM voice_sessions
        WHERE user_id = $1
        ORDER BY started_at DESC
        LIMIT $2
      `, [userId, limit])

      return NextResponse.json({
        success: true,
        sessions: sessions || [],
        count: sessions?.length || 0
      })
    } catch (dbError) {
      console.error('[Session End] Fetch error:', dbError)
      return NextResponse.json({
        success: true,
        sessions: [],
        reason: 'No sessions found or table does not exist'
      })
    }

  } catch (error) {
    console.error('[Session End] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}
