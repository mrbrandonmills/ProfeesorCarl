/**
 * POST /api/memory/process
 * Process a completed conversation and extract memories
 * OR save a single memory/insight (for mobile voice sessions)
 */

import { NextRequest, NextResponse } from 'next/server'
import { saveConversationMemories } from '@/lib/memory/save-conversation-memory'
import { verifyToken } from '@/lib/auth/jwt'
import { execute } from '@/lib/db/postgres'
import { generateEmbedding } from '@/lib/ai/embeddings'
import { calculateMemoryStrength } from '@/lib/memory/hume-emotions'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      sessionId,
      messages,
      sessionData,
      demoContext,
      // Simple save fields (for mobile voice tool calls)
      type,
      content,
      category,
      source,
    } = body

    // Handle demo mode
    let effectiveUserId = userId
    if (demoContext?.isDemo && !userId) {
      effectiveUserId = 'demo-user-' + (sessionId?.slice(0, 8) || 'default')
    } else if (!userId) {
      // Try to get from auth token (cookies or header)
      let token = request.cookies.get('auth_token')?.value
      if (!token) {
        const authHeader = request.headers.get('authorization')
        if (authHeader?.startsWith('Bearer ')) {
          token = authHeader.substring(7)
        }
      }
      if (token) {
        const payload = verifyToken(token)
        if (payload) {
          effectiveUserId = payload.userId
        }
      }
    }

    if (!effectiveUserId) {
      return NextResponse.json(
        { error: 'userId required' },
        { status: 400 }
      )
    }

    // =============================================
    // SIMPLE SAVE MODE (for mobile voice tool calls)
    // =============================================
    if (content && !messages) {
      console.log(`[Memory Process] Simple save for user ${effectiveUserId}: ${content.substring(0, 50)}...`)

      // Generate embedding for semantic search
      const embedding = await generateEmbedding(content)
      const embeddingStr = `[${embedding.join(',')}]`

      // Calculate initial memory strength
      const memoryStrength = calculateMemoryStrength({
        timesCited: 0,
        humeArousal: 0.6, // Default moderate arousal for insights
        textArousal: 0.6,
        llmImportance: 0.7, // Insights are important
        timesRetrievedUnused: 0,
      })

      const memoryType = type === 'user' ? 'user_memories' : 'carl_relational_memories'

      if (type === 'user') {
        await execute(`
          INSERT INTO user_memories
          (user_id, content, summary, category, embedding, confidence, source_type,
           memory_strength, current_importance, granularity)
          VALUES ($1, $2, $3, $4, $5::vector, 0.9, $6, $7, $7, 'utterance')
        `, [
          effectiveUserId,
          content,
          content.substring(0, 100),
          category || 'personal_fact',
          embeddingStr,
          source || 'voice_session',
          memoryStrength,
        ])
      } else {
        await execute(`
          INSERT INTO carl_relational_memories
          (user_id, content, summary, memory_type, embedding, source_session_id,
           memory_strength, current_importance, granularity)
          VALUES ($1, $2, $3, $4, $5::vector, $6, $7, $7, 'turn')
        `, [
          effectiveUserId,
          content,
          content.substring(0, 100),
          category || 'relationship_insight',
          embeddingStr,
          sessionId || null,
          memoryStrength,
        ])
      }

      console.log(`[Memory Process] Saved ${memoryType} with strength ${memoryStrength.toFixed(2)}`)

      return NextResponse.json({
        success: true,
        memoryStrength,
        type: memoryType,
      })
    }

    // =============================================
    // FULL CONVERSATION MODE (original behavior)
    // =============================================
    if (!sessionId || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'sessionId and messages array required (or content for simple save)' },
        { status: 400 }
      )
    }

    console.log(`[Memory Process] Processing ${messages.length} messages for user ${effectiveUserId}`)

    const result = await saveConversationMemories(
      effectiveUserId,
      sessionId,
      messages,
      sessionData
    )

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('[Memory Process] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Processing failed' },
      { status: 500 }
    )
  }
}
