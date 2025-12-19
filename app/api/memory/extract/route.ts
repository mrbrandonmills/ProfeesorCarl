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
    const { sessionId, userId = 'brandon' } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId required' },
        { status: 400 }
      )
    }

    console.log('[Extract] Starting extraction for session:', sessionId, 'user:', userId)

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
        WHERE session_id = $1 AND user_id = $2
        ORDER BY timestamp ASC
      `, [sessionId, userId])

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

      // Save user memories with cognitive scoring
      for (const memory of extracted.brandonMemories) {
        const embeddingStr = `[${memory.embedding.join(',')}]`
        // Calculate initial memory strength using LUFY formula
        // S = 2.76×arousal + 0.44×importance + 1.02×retrieval - 0.012×unused
        const memoryStrength = 2.76 * memory.emotional_arousal + 0.44 * memory.llm_importance + 1.02 * 0 - 0.012 * 0
        await execute(`
          INSERT INTO user_memories
          (user_id, content, summary, category, embedding, confidence, source_session_id, source_type,
           emotional_arousal, emotional_valence, dominant_emotion, llm_importance,
           memory_strength, current_importance, granularity, perplexity)
          VALUES ($1, $2, $3, $4, $5::vector, $6, $7, 'conversation',
                  $8, $9, $10, $11, $12, $12, $13, $14)
        `, [
          userId,
          memory.content,
          memory.summary,
          memory.category,
          embeddingStr,
          memory.confidence,
          sessionId,
          memory.emotional_arousal,
          memory.emotional_valence,
          memory.dominant_emotion,
          memory.llm_importance,
          memoryStrength,
          memory.granularity,
          memory.perplexity,
        ])
      }

      // Save Carl memories with cognitive scoring
      for (const memory of extracted.carlMemories) {
        const embeddingStr = `[${memory.embedding.join(',')}]`
        // Calculate initial memory strength using LUFY formula
        const memoryStrength = 2.76 * memory.emotional_arousal + 0.44 * memory.llm_importance + 1.02 * 0 - 0.012 * 0
        await execute(`
          INSERT INTO carl_relational_memories
          (user_id, content, summary, memory_type, embedding, effectiveness_score, emotional_context, source_session_id,
           emotional_arousal, emotional_valence, dominant_emotion, llm_importance,
           memory_strength, current_importance, granularity)
          VALUES ($1, $2, $3, $4, $5::vector, $6, $7, $8,
                  $9, $10, $11, $12, $13, $13, $14)
        `, [
          userId,
          memory.content,
          memory.summary,
          memory.type,
          embeddingStr,
          memory.effectivenessScore || null,
          memory.emotionalContext ? JSON.stringify(memory.emotionalContext) : null,
          sessionId,
          memory.emotional_arousal,
          memory.emotional_valence,
          memory.dominant_emotion,
          memory.llm_importance,
          memoryStrength,
          memory.granularity,
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
