import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getEnvVar } from '@/lib/env'

export async function GET(request: NextRequest) {
  try {
    // Validate required env vars
    try {
      getEnvVar('SUPABASE_SERVICE_ROLE_KEY')
    } catch (envError) {
      return NextResponse.json(
        {
          error: 'Server configuration error',
          message:
            envError instanceof Error
              ? envError.message
              : 'Missing environment variables',
        },
        { status: 500 }
      )
    }

    const token = request.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get courseId from query params
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 })
    }

    // Query video library
    const { data: videos, error } = await supabaseAdmin
      .from('video_library')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch videos', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ videos: videos || [] })
  } catch (error) {
    console.error('Video library GET error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch video library',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate required env vars
    try {
      getEnvVar('SUPABASE_SERVICE_ROLE_KEY')
    } catch (envError) {
      return NextResponse.json(
        {
          error: 'Server configuration error',
          message:
            envError instanceof Error
              ? envError.message
              : 'Missing environment variables',
        },
        { status: 500 }
      )
    }

    const token = request.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Only teachers can add videos
    if (payload.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden: Teacher role required' }, { status: 403 })
    }

    const {
      courseId,
      youtubeUrl,
      title,
      duration,
      topics,
      difficulty,
      concepts,
      thumbnailUrl,
    } = await request.json()

    // Validate required fields
    if (!courseId || !youtubeUrl || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Insert into video_library table
    const { data: video, error } = await supabaseAdmin
      .from('video_library')
      .insert({
        teacher_id: payload.userId,
        course_id: courseId,
        youtube_url: youtubeUrl,
        title,
        duration: duration || 0,
        topics: topics || [],
        difficulty: difficulty || 'intermediate',
        concepts: concepts || [],
        thumbnail_url: thumbnailUrl || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to add video', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ video }, { status: 201 })
  } catch (error) {
    console.error('Video library POST error:', error)
    return NextResponse.json(
      {
        error: 'Failed to add video to library',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
