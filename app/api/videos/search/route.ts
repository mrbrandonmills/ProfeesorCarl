// ===========================================
// YOUTUBE VIDEO SEARCH API
// ===========================================
// Search for educational YouTube videos on a topic

import { NextRequest, NextResponse } from 'next/server'
import { searchVideos } from '@/lib/youtube/api'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const topic = searchParams.get('topic')
    const limit = parseInt(searchParams.get('limit') || '5', 10)

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic parameter is required' },
        { status: 400 }
      )
    }

    console.log('[Video Search] Searching for:', topic, 'limit:', limit)

    const videos = await searchVideos(topic, Math.min(limit, 10))

    console.log('[Video Search] Found', videos.length, 'videos')

    return NextResponse.json({
      success: true,
      topic,
      videos,
      count: videos.length,
      apiKeyConfigured: !!process.env.YOUTUBE_API_KEY,
    })
  } catch (error) {
    console.error('[Video Search] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to search videos' },
      { status: 500 }
    )
  }
}
