import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'
import { verifyToken } from '@/lib/auth/jwt'

async function getDbClient() {
  const client = new Client({
    connectionString: process.env.POSTGRES_URL || process.env.POSTGRES_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })
  await client.connect()
  return client
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = await getDbClient()

  try {
    const materialId = params.id

    // Verify authentication
    const token = request.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = payload.userId

    // Get material details
    const materialResult = await client.query(
      `SELECT
        m.id,
        m.lesson_id,
        m.type,
        m.title,
        m.content_url,
        m.transcript,
        m.duration_seconds
      FROM materials m
      WHERE m.id = $1`,
      [materialId]
    )

    if (materialResult.rows.length === 0) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }

    const material = materialResult.rows[0]

    // Get lesson details
    const lessonResult = await client.query(
      `SELECT
        l.id,
        l.title,
        l.learning_objectives,
        l.course_id,
        c.title as course_title
      FROM lessons l
      JOIN courses c ON c.id = l.course_id
      WHERE l.id = $1`,
      [material.lesson_id]
    )

    if (lessonResult.rows.length === 0) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    const lesson = lessonResult.rows[0]

    // Get student progress for this material
    const progressResult = await client.query(
      `SELECT
        status,
        time_spent_seconds,
        started_at,
        completed_at
      FROM student_progress
      WHERE user_id = $1 AND material_id = $2`,
      [userId, materialId]
    )

    const progress = progressResult.rows.length > 0
      ? progressResult.rows[0]
      : {
          status: 'not_started',
          time_spent_seconds: 0,
          started_at: null,
          completed_at: null
        }

    return NextResponse.json({
      material: {
        id: material.id,
        lesson_id: material.lesson_id,
        type: material.type,
        title: material.title,
        content_url: material.content_url,
        transcript: material.transcript,
        duration_seconds: material.duration_seconds
      },
      lesson: {
        id: lesson.id,
        title: lesson.title,
        objectives: lesson.learning_objectives || [],
        course_id: lesson.course_id,
        course_title: lesson.course_title
      },
      progress: {
        status: progress.status,
        time_spent_seconds: progress.time_spent_seconds || 0
      }
    })

  } catch (error) {
    console.error('Error fetching material:', error)
    return NextResponse.json(
      { error: 'Failed to fetch material details' },
      { status: 500 }
    )
  } finally {
    await client.end()
  }
}
