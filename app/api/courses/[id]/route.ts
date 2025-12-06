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
    const courseId = params.id

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

    // Get course info
    const courseResult = await client.query(
      `SELECT c.id, c.title, c.description, u.name as teacher_name
       FROM courses c
       LEFT JOIN users u ON c.teacher_id = u.id
       WHERE c.id = $1`,
      [courseId]
    )

    if (courseResult.rows.length === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const course = courseResult.rows[0]

    // Get lessons with materials and progress
    const lessonsResult = await client.query(
      `SELECT
        l.id,
        l.title,
        l.description,
        l.learning_objectives,
        l.lesson_order
      FROM lessons l
      WHERE l.course_id = $1
      ORDER BY l.lesson_order ASC`,
      [courseId]
    )

    const lessons = await Promise.all(
      lessonsResult.rows.map(async (lesson) => {
        // Get materials for this lesson
        const materialsResult = await client.query(
          `SELECT
            m.id,
            m.type,
            m.title,
            m.content_url,
            COALESCE(sp.status, 'not_started') as status
          FROM materials m
          LEFT JOIN student_progress sp
            ON sp.material_id = m.id AND sp.user_id = $1
          WHERE m.lesson_id = $2
          ORDER BY m.material_order ASC`,
          [userId, lesson.id]
        )

        // Calculate lesson completion percentage
        const materials = materialsResult.rows
        const completedCount = materials.filter(m => m.status === 'completed').length
        const completionPercentage = materials.length > 0
          ? Math.round((completedCount / materials.length) * 100)
          : 0

        return {
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          objectives: lesson.learning_objectives || [],
          materials: materials.map(m => ({
            id: m.id,
            type: m.type,
            title: m.title,
            status: m.status
          })),
          completion_percentage: completionPercentage
        }
      })
    )

    // Calculate overall course completion
    const totalMaterials = lessons.reduce((sum, l) => sum + l.materials.length, 0)
    const completedMaterials = lessons.reduce(
      (sum, l) => sum + l.materials.filter(m => m.status === 'completed').length,
      0
    )
    const overallCompletion = totalMaterials > 0
      ? Math.round((completedMaterials / totalMaterials) * 100)
      : 0

    return NextResponse.json({
      id: course.id,
      title: course.title,
      description: course.description,
      teacher_name: course.teacher_name,
      lessons,
      overall_completion: overallCompletion
    })

  } catch (error) {
    console.error('Error fetching course:', error)
    return NextResponse.json(
      { error: 'Failed to fetch course details' },
      { status: 500 }
    )
  } finally {
    await client.end()
  }
}
