import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { getCanvasToken } from '@/lib/canvas/oauth'
import { createCanvasClient, CanvasModuleItem } from '@/lib/canvas/client'
import { queryOne, execute } from '@/lib/db/postgres'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/canvas/courses/[id]/sync
 * Import a Canvas course into Professor Carl
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const canvasCourseId = parseInt(id, 10)

    if (isNaN(canvasCourseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 })
    }

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

    // Create Canvas client
    const client = createCanvasClient(canvasToken.canvas_instance_url, canvasToken.access_token)

    // Fetch course details
    const canvasCourse = await client.getCourse(canvasCourseId)

    // Check if course already exists in our database
    const existingCourse = await queryOne(`
      SELECT id FROM courses WHERE canvas_course_id = $1 AND teacher_id = $2
    `, [canvasCourseId.toString(), payload.userId])

    let courseId: string

    if (existingCourse) {
      // Update existing course
      courseId = existingCourse.id
      await execute(`
        UPDATE courses SET
          title = $1,
          description = $2,
          updated_at = NOW()
        WHERE id = $3
      `, [canvasCourse.name, `Imported from Canvas: ${canvasCourse.course_code}`, courseId])
    } else {
      // Create new course
      const newCourse = await queryOne<{ id: string }>(`
        INSERT INTO courses (teacher_id, title, description, upload_method, canvas_course_id)
        VALUES ($1, $2, $3, 'canvas', $4)
        RETURNING id
      `, [payload.userId, canvasCourse.name, `Imported from Canvas: ${canvasCourse.course_code}`, canvasCourseId.toString()])

      if (!newCourse) {
        throw new Error('Failed to create course')
      }
      courseId = newCourse.id
    }

    // Fetch modules
    const modules = await client.getCourseModules(canvasCourseId)

    let lessonsCreated = 0
    let materialsCreated = 0

    // Import each module as a lesson
    for (const module of modules) {
      // Check if lesson already exists
      const existingLesson = await queryOne(`
        SELECT id FROM lessons WHERE course_id = $1 AND canvas_module_id = $2
      `, [courseId, module.id.toString()])

      let lessonId: string

      if (existingLesson) {
        lessonId = existingLesson.id
        await execute(`
          UPDATE lessons SET
            title = $1,
            order_index = $2,
            updated_at = NOW()
          WHERE id = $3
        `, [module.name, module.position, lessonId])
      } else {
        const newLesson = await queryOne<{ id: string }>(`
          INSERT INTO lessons (course_id, title, order_index, canvas_module_id)
          VALUES ($1, $2, $3, $4)
          RETURNING id
        `, [courseId, module.name, module.position, module.id.toString()])

        if (!newLesson) {
          console.error(`Failed to create lesson for module: ${module.name}`)
          continue
        }
        lessonId = newLesson.id
        lessonsCreated++
      }

      // Fetch and import module items
      try {
        const items = await client.getModuleItems(canvasCourseId, module.id)

        for (const item of items) {
          await importModuleItem(client, canvasCourseId, lessonId, item)
          materialsCreated++
        }
      } catch (itemError) {
        console.error(`Error fetching items for module ${module.id}:`, itemError)
      }
    }

    console.log(`[Canvas Sync] Course ${canvasCourseId} synced: ${lessonsCreated} lessons, ${materialsCreated} materials`)

    return NextResponse.json({
      success: true,
      courseId,
      courseName: canvasCourse.name,
      stats: {
        modulesImported: modules.length,
        lessonsCreated,
        materialsCreated,
      },
    })
  } catch (error) {
    console.error('[Canvas Sync] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    )
  }
}

/**
 * Import a single module item as lesson material
 */
async function importModuleItem(
  client: ReturnType<typeof createCanvasClient>,
  courseId: number,
  lessonId: string,
  item: CanvasModuleItem
): Promise<void> {
  // Skip sub-headers and unsupported types
  if (item.type === 'SubHeader') return

  let content = ''
  let materialType = 'text'

  try {
    switch (item.type) {
      case 'Page':
        if (item.page_url) {
          const page = await client.getPage(courseId, item.page_url)
          content = page.body || ''
          materialType = 'text'
        }
        break

      case 'ExternalUrl':
        content = item.external_url || ''
        materialType = 'link'
        break

      case 'File':
        if (item.content_id) {
          const file = await client.getFile(item.content_id)
          content = file.url
          materialType = file.content_type?.includes('video') ? 'video' : 'file'
        }
        break

      case 'Assignment':
      case 'Quiz':
      case 'Discussion':
        content = item.html_url || ''
        materialType = 'link'
        break

      default:
        content = item.html_url || ''
        materialType = 'link'
    }
  } catch (fetchError) {
    console.error(`Error fetching content for item ${item.id}:`, fetchError)
    content = item.html_url || ''
    materialType = 'link'
  }

  // Skip if no content
  if (!content) return

  // Check if material already exists
  const existing = await queryOne(`
    SELECT id FROM lesson_materials WHERE lesson_id = $1 AND canvas_item_id = $2
  `, [lessonId, item.id.toString()])

  if (existing) {
    await execute(`
      UPDATE lesson_materials SET
        title = $1,
        content = $2,
        material_type = $3,
        order_index = $4,
        updated_at = NOW()
      WHERE id = $5
    `, [item.title, content, materialType, item.position, existing.id])
  } else {
    await execute(`
      INSERT INTO lesson_materials (lesson_id, title, content, material_type, order_index, canvas_item_id)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [lessonId, item.title, content, materialType, item.position, item.id.toString()])
  }
}
