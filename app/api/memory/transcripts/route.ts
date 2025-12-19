// ===========================================
// CONVERSATION TRANSCRIPTS API
// ===========================================
// Save and retrieve full conversation transcripts

import { NextRequest, NextResponse } from 'next/server'
import { query, execute } from '@/lib/db/postgres'
import { generateEmbedding } from '@/lib/ai/embeddings'

interface TranscriptEntry {
  role: 'user' | 'assistant'
  content: string
  emotions?: Record<string, number>
  timestamp?: string
}

// POST: Save transcript entries for a session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, transcript } = body as {
      sessionId: string
      transcript: TranscriptEntry[]
    }

    if (!sessionId || !transcript || !Array.isArray(transcript)) {
      return NextResponse.json(
        { error: 'sessionId and transcript array required' },
        { status: 400 }
      )
    }

    console.log('[Transcripts] Saving', transcript.length, 'entries for session:', sessionId)

    let savedCount = 0

    for (const entry of transcript) {
      if (!entry.content || entry.content.trim().length === 0) continue

      // Generate embedding for semantic search
      const embedding = await generateEmbedding(entry.content)
      const embeddingStr = `[${embedding.join(',')}]`

      // Determine dominant emotion if emotions provided
      let dominantEmotion: string | null = null
      let emotionIntensity: number | null = null

      if (entry.emotions && Object.keys(entry.emotions).length > 0) {
        const sorted = Object.entries(entry.emotions).sort((a, b) => b[1] - a[1])
        dominantEmotion = sorted[0][0]
        emotionIntensity = sorted[0][1]
      }

      await execute(`
        INSERT INTO conversation_transcripts
        (session_id, role, content, emotions, dominant_emotion, emotion_intensity, embedding, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6, $7::vector, $8)
      `, [
        sessionId,
        entry.role,
        entry.content,
        entry.emotions ? JSON.stringify(entry.emotions) : null,
        dominantEmotion,
        emotionIntensity,
        embeddingStr,
        entry.timestamp ? new Date(entry.timestamp) : new Date(),
      ])

      savedCount++
    }

    console.log('[Transcripts] Saved', savedCount, 'entries')

    return NextResponse.json({
      success: true,
      sessionId,
      savedCount,
    })

  } catch (error) {
    console.error('[Transcripts] Error saving:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save transcript' },
      { status: 500 }
    )
  }
}

// GET: Retrieve transcripts for a session
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('sessionId')
  const limit = parseInt(searchParams.get('limit') || '100')

  if (!sessionId) {
    return NextResponse.json(
      { error: 'sessionId required' },
      { status: 400 }
    )
  }

  try {
    const transcripts = await query(`
      SELECT
        id,
        role,
        content,
        emotions,
        dominant_emotion,
        emotion_intensity,
        timestamp
      FROM conversation_transcripts
      WHERE session_id = $1
      ORDER BY timestamp ASC
      LIMIT $2
    `, [sessionId, limit])

    return NextResponse.json({
      success: true,
      sessionId,
      transcript: transcripts,
      count: transcripts.length,
    })

  } catch (error) {
    console.error('[Transcripts] Error fetching:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch transcript' },
      { status: 500 }
    )
  }
}
