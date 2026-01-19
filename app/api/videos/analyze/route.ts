import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { extractVideoId, getVideoMetadata } from '@/lib/youtube/api'
import { getEnvVar } from '@/lib/env'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    // Validate required env vars
    try {
      getEnvVar('YOUTUBE_API_KEY')
      getEnvVar('ANTHROPIC_API_KEY')
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

    // Only teachers can analyze videos
    if (payload.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden: Teacher role required' }, { status: 403 })
    }

    const { youtubeUrl } = await request.json()

    if (!youtubeUrl) {
      return NextResponse.json({ error: 'YouTube URL is required' }, { status: 400 })
    }

    // Extract video ID
    const videoId = extractVideoId(youtubeUrl)
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
    }

    // Get video metadata from YouTube API
    const metadata = await getVideoMetadata(videoId)

    // Analyze video with Claude
    const tagsString = metadata.tags.join(', ')
    const analysisPrompt = `Analyze this educational video and extract key information:

Title: ${metadata.title}
Description: ${metadata.description}
Channel: ${metadata.channelTitle}
Tags: ${tagsString}

Please provide a JSON response with:
1. "topics": An array of main educational topics covered (e.g., ["algebra", "quadratic equations"])
2. "difficulty": Educational level (e.g., "beginner", "intermediate", "advanced")
3. "concepts": An array of specific concepts taught (e.g., ["factoring", "quadratic formula"])

Respond ONLY with valid JSON, no additional text.`

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 1024,
      system: 'You are an educational content analyzer. Respond only with valid JSON.',
      messages: [
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
    })

    const textContent = response.content.find((block) => block.type === 'text')
    const analysisText = textContent?.type === 'text' ? textContent.text : '{}'

    // Parse Claude's JSON response
    let analysis
    try {
      // Remove markdown code blocks if present
      const cleanJson = analysisText.replace(/```json\n?|\n?```/g, '').trim()
      analysis = JSON.parse(cleanJson)
    } catch (parseError) {
      console.error('Failed to parse Claude response:', analysisText)
      // Fallback to default values
      analysis = {
        topics: [],
        difficulty: 'intermediate',
        concepts: [],
      }
    }

    // Return combined metadata and analysis
    return NextResponse.json({
      metadata: {
        id: metadata.id,
        title: metadata.title,
        description: metadata.description,
        thumbnailUrl: metadata.thumbnailUrl,
        channelTitle: metadata.channelTitle,
        publishedAt: metadata.publishedAt,
        duration: metadata.duration,
      },
      analysis: {
        topics: analysis.topics || [],
        difficulty: analysis.difficulty || 'intermediate',
        concepts: analysis.concepts || [],
      },
    })
  } catch (error) {
    console.error('Video analysis error:', error)
    return NextResponse.json(
      {
        error: 'Failed to analyze video',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
