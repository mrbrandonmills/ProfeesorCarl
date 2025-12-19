// ===========================================
// MEMORY EXTRACTION API
// ===========================================
// Triggers extraction pipeline for a completed session

import { NextRequest, NextResponse } from 'next/server'
import { query, execute } from '@/lib/db/postgres'
import { extractMemoriesFromConversation } from '@/lib/memory/extraction'

// POST: Extract memories from a session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId required' },
        { status: 400 }
      )
    }

    console.log('[Extract] Starting extraction for session:', sessionId)

    // Create extraction job
    const jobResult = await query<{ id: string }>(`
      INSERT INTO memory_extraction_jobs (session_id, status, extraction_type)
      VALUES ($1, 'processing', 'post_session')
      RETURNING id
    `, [sessionId])

    const jobId = jobResult[0]?.id
    if (!jobId) {
      throw new Error('Failed to create extraction job')
    }

    try {
      // Get session transcripts
      const transcripts = await query(`
        SELECT role, content, emotions, dominant_emotion, emotion_intensity, timestamp
        FROM conversation_transcripts
        WHERE session_id = $1
        ORDER BY timestamp ASC
      `, [sessionId])

      if (!transcripts || transcripts.length === 0) {
        console.log('[Extract] No transcripts found for session')
        await execute(`
          UPDATE memory_extraction_jobs
          SET status = 'completed', completed_at = NOW(),
              brandon_memories_extracted = 0, carl_memories_extracted = 0
          WHERE id = $1
        `, [jobId])

        return NextResponse.json({
          success: true,
          jobId,
          extracted: { brandon: 0, carl: 0 },
          message: 'No transcripts to process',
        })
      }

      // Run extraction
      const extracted = await extractMemoriesFromConversation(transcripts)

      // Save Brandon memories
      for (const memory of extracted.brandonMemories) {
        const embeddingStr = `[${memory.embedding.join(',')}]`
        await execute(`
          INSERT INTO brandon_memories
          (content, summary, category, embedding, confidence, source_session_id, source_type)
          VALUES ($1, $2, $3, $4::vector, $5, $6, 'conversation')
        `, [
          memory.content,
          memory.summary,
          memory.category,
          embeddingStr,
          memory.confidence,
          sessionId,
        ])
      }

      // Save Carl memories
      for (const memory of extracted.carlMemories) {
        const embeddingStr = `[${memory.embedding.join(',')}]`
        await execute(`
          INSERT INTO carl_relational_memories
          (content, summary, memory_type, embedding, effectiveness_score, emotional_context, source_session_id)
          VALUES ($1, $2, $3, $4::vector, $5, $6, $7)
        `, [
          memory.content,
          memory.summary,
          memory.type,
          embeddingStr,
          memory.effectivenessScore || null,
          memory.emotionalContext ? JSON.stringify(memory.emotionalContext) : null,
          sessionId,
        ])
      }

      // Update job status
      await execute(`
        UPDATE memory_extraction_jobs
        SET status = 'completed', completed_at = NOW(),
            brandon_memories_extracted = $1, carl_memories_extracted = $2
        WHERE id = $3
      `, [extracted.brandonMemories.length, extracted.carlMemories.length, jobId])

      // Update voice session to mark extraction complete
      await execute(`
        UPDATE voice_sessions
        SET memories_extracted = true, extraction_job_id = $1
        WHERE id = $2
      `, [jobId, sessionId])

      console.log('[Extract] Completed:', extracted.brandonMemories.length, 'Brandon,', extracted.carlMemories.length, 'Carl')

      return NextResponse.json({
        success: true,
        jobId,
        extracted: {
          brandon: extracted.brandonMemories.length,
          carl: extracted.carlMemories.length,
        },
      })

    } catch (extractionError) {
      console.error('[Extract] Extraction failed:', extractionError)

      // Update job with error
      await execute(`
        UPDATE memory_extraction_jobs
        SET status = 'failed', error_message = $1
        WHERE id = $2
      `, [
        extractionError instanceof Error ? extractionError.message : 'Unknown error',
        jobId,
      ])

      throw extractionError
    }

  } catch (error) {
    console.error('[Extract] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Extraction failed' },
      { status: 500 }
    )
  }
}

// GET: Check extraction job status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('jobId')
  const sessionId = searchParams.get('sessionId')

  try {
    let job

    if (jobId) {
      const result = await query(`
        SELECT * FROM memory_extraction_jobs WHERE id = $1
      `, [jobId])
      job = result[0]
    } else if (sessionId) {
      const result = await query(`
        SELECT * FROM memory_extraction_jobs
        WHERE session_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `, [sessionId])
      job = result[0]
    } else {
      return NextResponse.json(
        { error: 'jobId or sessionId required' },
        { status: 400 }
      )
    }

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        sessionId: job.session_id,
        status: job.status,
        brandonMemories: job.brandon_memories_extracted,
        carlMemories: job.carl_memories_extracted,
        error: job.error_message,
        createdAt: job.created_at,
        completedAt: job.completed_at,
      },
    })

  } catch (error) {
    console.error('[Extract] Status check error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check status' },
      { status: 500 }
    )
  }
}
