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

export async function POST(request: NextRequest) {
  const client = await getDbClient()

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

    // Parse request body
    const { courseId } = await request.json()

    if (!courseId) {
      return NextResponse.json({ error: 'Missing courseId' }, { status: 400 })
    }

    // Check if already enrolled
    const checkResult = await client.query(
      'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [payload.userId, courseId]
    )

    if (checkResult.rows.length > 0) {
      return NextResponse.json({ message: 'Already enrolled' })
    }

    // Enroll the student
    await client.query(
      'INSERT INTO enrollments (user_id, course_id, enrolled_at) VALUES ($1, $2, NOW())',
      [payload.userId, courseId]
    )

    return NextResponse.json({ success: true, message: 'Enrolled successfully' })

  } catch (error) {
    console.error('Error enrolling student:', error)
    return NextResponse.json(
      { error: 'Failed to enroll in course' },
      { status: 500 }
    )
  } finally {
    await client.end()
  }
}
