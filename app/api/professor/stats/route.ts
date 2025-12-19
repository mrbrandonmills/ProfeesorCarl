import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { query, queryOne } from '@/lib/db/postgres'

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check role
    if (payload.role !== 'teacher') {
      return NextResponse.json({ error: 'Not authorized - teacher role required' }, { status: 403 })
    }

    // Get aggregate stats for this teacher's courses
    const stats = await queryOne(`
      SELECT
        COUNT(DISTINCT c.id) as total_courses,
        COUNT(DISTINCT e.student_id) as total_students,
        COUNT(DISTINCT vs.id) as total_sessions,
        COALESCE(AVG(vs.average_engagement), 0) as avg_engagement,
        COALESCE(SUM(vs.breakthrough_count), 0) as total_breakthroughs,
        COALESCE(SUM(vs.duration_seconds), 0) as total_learning_time
      FROM courses c
      LEFT JOIN enrollments e ON e.course_id = c.id
      LEFT JOIN voice_sessions vs ON vs.user_id = e.student_id
      WHERE c.teacher_id = $1
    `, [payload.userId])

    // Get recent activity (last 7 days)
    const recentActivity = await query(`
      SELECT
        DATE(vs.started_at) as date,
        COUNT(*) as session_count,
        SUM(vs.breakthrough_count) as breakthroughs
      FROM voice_sessions vs
      JOIN enrollments e ON e.student_id = vs.user_id
      JOIN courses c ON c.id = e.course_id
      WHERE c.teacher_id = $1
        AND vs.started_at > NOW() - INTERVAL '7 days'
      GROUP BY DATE(vs.started_at)
      ORDER BY date DESC
    `, [payload.userId])

    return NextResponse.json({
      success: true,
      stats: {
        totalCourses: parseInt(stats?.total_courses) || 0,
        totalStudents: parseInt(stats?.total_students) || 0,
        totalSessions: parseInt(stats?.total_sessions) || 0,
        avgEngagement: parseFloat(stats?.avg_engagement) || 0,
        totalBreakthroughs: parseInt(stats?.total_breakthroughs) || 0,
        totalLearningTimeMinutes: Math.round((parseInt(stats?.total_learning_time) || 0) / 60),
      },
      recentActivity: recentActivity.map((r: any) => ({
        date: r.date,
        sessionCount: parseInt(r.session_count) || 0,
        breakthroughs: parseInt(r.breakthroughs) || 0,
      }))
    })

  } catch (error) {
    console.error('[Professor Stats] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
