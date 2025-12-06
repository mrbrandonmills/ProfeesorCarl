import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'
import { verifyToken } from '@/lib/auth/jwt'

// Database connection helper
async function getDbClient() {
  const client = new Client({
    connectionString: process.env.POSTGRES_URL || process.env.POSTGRES_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })
  await client.connect()
  return client
}

interface Material {
  type: 'video' | 'document' | 'link'
  title: string
  url: string
}

interface Lesson {
  title: string
  objectives: string[]
  materials: Material[]
}

interface CourseCreateRequest {
  title: string
  description: string
  upload_method: 'topic-based' | 'document-video' | 'canvas-import'
  lessons: Lesson[]
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
    const body: CourseCreateRequest = await request.json()
    const { title, description, upload_method, lessons } = body

    // Validate required fields
    if (!title || !upload_method || !lessons || lessons.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: title, upload_method, and at least one lesson' },
        { status: 400 }
      )
    }

    // Start transaction
    await client.query('BEGIN')

    // 1. Create course
    const courseResult = await client.query(
      `INSERT INTO courses (teacher_id, title, description, upload_method, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id`,
      [payload.userId, title, description || null, upload_method]
    )
    const courseId = courseResult.rows[0].id

    // 2. Create lessons with materials
    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i]

      // Insert lesson
      const lessonResult = await client.query(
        `INSERT INTO lessons (course_id, title, description, learning_objectives, lesson_order, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING id`,
        [
          courseId,
          lesson.title,
          null, // description (optional)
          lesson.objectives.filter(obj => obj.trim() !== ''), // Remove empty objectives
          i + 1 // lesson_order starts at 1
        ]
      )
      const lessonId = lessonResult.rows[0].id

      // Insert materials for this lesson
      for (let j = 0; j < lesson.materials.length; j++) {
        const material = lesson.materials[j]

        // Skip materials with empty title or URL
        if (!material.title.trim() || !material.url.trim()) continue

        // Extract video ID from YouTube URL if material is a video
        let videoId = null
        let duration = null
        if (material.type === 'video' && material.url.includes('youtube.com')) {
          const match = material.url.match(/[?&]v=([^&]+)/)
          if (match) {
            videoId = match[1]
            // TODO: Fetch video duration from YouTube API in background job
          }
        }

        await client.query(
          `INSERT INTO materials (lesson_id, type, title, content_url, transcript, duration_seconds, material_order, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
          [
            lessonId,
            material.type,
            material.title,
            material.url,
            null, // transcript (to be fetched later)
            duration,
            j + 1 // material_order starts at 1
          ]
        )
      }
    }

    // Commit transaction
    await client.query('COMMIT')

    return NextResponse.json({
      success: true,
      courseId,
      message: 'Course created successfully'
    })

  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK')
    console.error('Error creating course:', error)
    return NextResponse.json(
      { error: 'Failed to create course', details: (error as Error).message },
      { status: 500 }
    )
  } finally {
    await client.end()
  }
}
