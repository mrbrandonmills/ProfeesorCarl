import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { query } from '@/lib/db/postgres'

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

    // Fetch courses for this teacher with lesson and student counts
    const courses = await query(`
      SELECT
        c.id,
        c.title,
        c.description,
        c.upload_method,
        c.created_at,
        c.updated_at,
        COUNT(DISTINCT l.id) as lesson_count,
        COUNT(DISTINCT e.student_id) as student_count
      FROM courses c
      LEFT JOIN lessons l ON l.course_id = c.id
      LEFT JOIN enrollments e ON e.course_id = c.id
      WHERE c.teacher_id = $1
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `, [payload.userId])

    return NextResponse.json({
      success: true,
      courses: courses.map((c: any) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        uploadMethod: c.upload_method,
        lessonCount: parseInt(c.lesson_count) || 0,
        studentCount: parseInt(c.student_count) || 0,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      }))
    })

  } catch (error) {
    console.error('[Professor Courses] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}
