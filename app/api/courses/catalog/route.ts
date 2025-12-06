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

export async function GET(request: NextRequest) {
  const client = await getDbClient()

  try {
    // Get user ID from token (if authenticated)
    const token = request.cookies.get('auth_token')?.value
    let userId: string | null = null

    if (token) {
      const payload = verifyToken(token)
      if (payload) {
        userId = payload.userId
      }
    }

    // Query to get all courses with metadata
    const query = `
      SELECT
        c.id,
        c.title,
        c.description,
        u.name as teacher_name,
        COUNT(DISTINCT l.id) as lesson_count,
        COUNT(DISTINCT e.user_id) as enrolled_count,
        ${userId ? `EXISTS(SELECT 1 FROM enrollments WHERE user_id = $1 AND course_id = c.id) as is_enrolled` : 'false as is_enrolled'}
      FROM courses c
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN lessons l ON l.course_id = c.id
      LEFT JOIN enrollments e ON e.course_id = c.id
      GROUP BY c.id, c.title, c.description, u.name
      ORDER BY c.created_at DESC
    `

    const result = await client.query(query, userId ? [userId] : [])

    return NextResponse.json({
      courses: result.rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        teacher_name: row.teacher_name,
        lesson_count: parseInt(row.lesson_count),
        enrolled_count: parseInt(row.enrolled_count),
        is_enrolled: row.is_enrolled
      }))
    })

  } catch (error) {
    console.error('Error fetching catalog:', error)
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    )
  } finally {
    await client.end()
  }
}
