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

    const userId = payload.userId
    const { materialId } = await request.json()

    if (!materialId) {
      return NextResponse.json({ error: 'Missing materialId' }, { status: 400 })
    }

    // Get material details to find course_id and lesson_id
    const materialResult = await client.query(
      `SELECT m.lesson_id, l.course_id
       FROM materials m
       JOIN lessons l ON l.id = m.lesson_id
       WHERE m.id = $1`,
      [materialId]
    )

    if (materialResult.rows.length === 0) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }

    const { lesson_id, course_id } = materialResult.rows[0]

    // Check if progress already exists
    const existingProgress = await client.query(
      'SELECT id FROM student_progress WHERE user_id = $1 AND material_id = $2',
      [userId, materialId]
    )

    if (existingProgress.rows.length > 0) {
      // Already started, just update timestamp
      await client.query(
        `UPDATE student_progress
         SET updated_at = NOW()
         WHERE user_id = $1 AND material_id = $2`,
        [userId, materialId]
      )
    } else {
      // Create new progress record
      await client.query(
        `INSERT INTO student_progress
         (user_id, course_id, lesson_id, material_id, status, started_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'in_progress', NOW(), NOW(), NOW())`,
        [userId, course_id, lesson_id, materialId]
      )
    }

    return NextResponse.json({ success: true, message: 'Progress started' })

  } catch (error) {
    console.error('Error starting progress:', error)
    return NextResponse.json(
      { error: 'Failed to start progress' },
      { status: 500 }
    )
  } finally {
    await client.end()
  }
}
