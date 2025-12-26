import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { retrieveStudentContext } from '@/lib/memory/mcp-client'
import { getEnvVar } from '@/lib/env'
import { query, execute } from '@/lib/db/postgres'
import { generateEmbedding } from '@/lib/ai/embeddings'
import { calculateMemoryStrength, combineArousalScores } from '@/lib/memory/hume-emotions'

export async function GET(request: NextRequest) {
  try {
    // Validate required env vars
    try {
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

    // Check for token in cookies OR Authorization header (for mobile)
    let token = request.cookies.get('auth_token')?.value
    if (!token) {
      const authHeader = request.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }
    }
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Retrieve student context from MCP Memory
    const context = await retrieveStudentContext(payload.userId)

    if (!context) {
      return NextResponse.json(
        {
          context: {
            topics_explored: [],
            current_understanding: '',
            learning_progress: '',
            conversation_summary: '',
          },
        },
        { status: 200 }
      )
    }

    return NextResponse.json({ context }, { status: 200 })
  } catch (error) {
    console.error('Memory retrieval error:', error)
    return NextResponse.json(
      {
        error: 'Failed to retrieve memory',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// ===========================================
// POST: Save memory with Hume prosody data
// ===========================================
// Combines real voice emotion (Hume) with text analysis for cognitive ranking

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId = 'brandon',
      type = 'user',           // 'user' or 'carl'
      content,
      category,
      sessionId,
      // Hume prosody data (real voice emotion)
      humeArousal = 0.5,      // 0-1 from voice prosody
      humeValence = 0,        // -1 to 1 from voice prosody
      humeDominantEmotion = 'neutral',
      // ALL raw Hume emotion scores (48 emotions)
      humeScores = {},        // { Joy: 0.3, Determination: 0.8, ... }
      // Optional text-analyzed emotion (from Claude extraction)
      textArousal,
      llmImportance = 0.5,
    } = body

    if (!content) {
      return NextResponse.json(
        { error: 'content required' },
        { status: 400 }
      )
    }

    console.log('[Memory] Saving with Hume prosody:', {
      userId,
      type,
      humeArousal: humeArousal.toFixed(2),
      humeValence: humeValence.toFixed(2),
      humeDominantEmotion,
    })

    // Generate embedding for semantic search
    const embedding = await generateEmbedding(content)
    const embeddingStr = `[${embedding.join(',')}]`

    // Combine Hume + text arousal (Hume weighted 70%, text 30%)
    const finalArousal = textArousal !== undefined
      ? combineArousalScores(humeArousal, textArousal)
      : humeArousal

    // Calculate initial memory strength using formula:
    // S = W_rep × log(1 + times_cited) + W_hume × arousal + W_text × text + W_imp × importance
    const memoryStrength = calculateMemoryStrength({
      timesCited: 0,           // New memory, no citations yet
      humeArousal: humeArousal,
      textArousal: textArousal || humeArousal,  // Fallback to Hume if no text
      llmImportance: llmImportance,
      timesRetrievedUnused: 0,
    })

    // Log top Hume emotions for debugging
    const topHumeEmotions = Object.entries(humeScores)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 5)
      .map(([e, s]) => `${e}: ${(s as number).toFixed(2)}`)
      .join(', ')
    if (topHumeEmotions) {
      console.log('[Memory] Top Hume emotions:', topHumeEmotions)
    }

    if (type === 'user') {
      // Save to user_memories with cognitive scoring + ALL Hume scores
      await execute(`
        INSERT INTO user_memories
        (user_id, content, summary, category, embedding, confidence, source_session_id, source_type,
         emotional_arousal, emotional_valence, dominant_emotion, llm_importance,
         memory_strength, current_importance, granularity, hume_scores)
        VALUES ($1, $2, $3, $4, $5::vector, 0.9, $6, 'voice',
                $7, $8, $9, $10, $11, $11, 'utterance', $12::jsonb)
      `, [
        userId,
        content,
        content.substring(0, 100),  // Auto-summary
        category || 'personal_fact',
        embeddingStr,
        sessionId,
        finalArousal,
        humeValence,
        humeDominantEmotion,
        llmImportance,
        memoryStrength,
        JSON.stringify(humeScores),  // ALL 48 Hume emotions
      ])
    } else {
      // Save to carl_relational_memories with ALL Hume scores
      await execute(`
        INSERT INTO carl_relational_memories
        (user_id, content, summary, memory_type, embedding, source_session_id,
         emotional_arousal, emotional_valence, dominant_emotion, llm_importance,
         memory_strength, current_importance, granularity, hume_scores)
        VALUES ($1, $2, $3, $4, $5::vector, $6,
                $7, $8, $9, $10, $11, $11, 'turn', $12::jsonb)
      `, [
        userId,
        content,
        content.substring(0, 100),
        category || 'interaction_pattern',
        embeddingStr,
        sessionId,
        finalArousal,
        humeValence,
        humeDominantEmotion,
        llmImportance,
        memoryStrength,
        JSON.stringify(humeScores),  // ALL 48 Hume emotions
      ])
    }

    console.log('[Memory] Saved with strength:', memoryStrength.toFixed(2))

    return NextResponse.json({
      success: true,
      memoryStrength,
      arousal: finalArousal,
      emotion: humeDominantEmotion,
    })

  } catch (error) {
    console.error('[Memory] Save error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save memory' },
      { status: 500 }
    )
  }
}
