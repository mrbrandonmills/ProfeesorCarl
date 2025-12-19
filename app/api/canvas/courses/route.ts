import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { getCanvasToken } from '@/lib/canvas/oauth'
import { createCanvasClient } from '@/lib/canvas/client'

/**
 * GET /api/canvas/courses
 * List Canvas courses for the authenticated user
 */
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

    // Get Canvas token
    const canvasToken = await getCanvasToken(payload.userId)
    if (!canvasToken) {
      return NextResponse.json({
        error: 'Canvas not connected',
        needsAuth: true,
      }, { status: 401 })
    }

    // Create Canvas client and fetch courses
    const client = createCanvasClient(canvasToken.canvas_instance_url, canvasToken.access_token)

    // Test connection first
    const isConnected = await client.testConnection()
    if (!isConnected) {
      return NextResponse.json({
        error: 'Canvas connection failed',
        needsReauth: true,
      }, { status: 401 })
    }

    // Get courses
    const courses = await client.getCourses()

    return NextResponse.json({
      success: true,
      courses: courses.map(course => ({
        id: course.id,
        name: course.name,
        courseCode: course.course_code,
        state: course.workflow_state,
        startAt: course.start_at,
        endAt: course.end_at,
        totalStudents: course.total_students,
      })),
    })
  } catch (error) {
    console.error('[Canvas Courses] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}
