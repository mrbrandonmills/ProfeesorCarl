// ===========================================
// MEMORY FEEDBACK API - Reinforcement Learning
// ===========================================
// Tracks which memories were cited vs unused in responses
// Updates memory effectiveness scores for better future retrieval

import { NextRequest, NextResponse } from 'next/server'
import { execute, query } from '@/lib/db/postgres'

// POST: Submit feedback on retrieved memories
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      sessionId,
      userId = 'brandon',
      retrievedMemoryIds = [],  // All memories that were retrieved
      citedMemoryIds = [],       // Memories that were actually referenced in response
    } = body

    if (!sessionId || !Array.isArray(retrievedMemoryIds)) {
      return NextResponse.json(
        { error: 'sessionId and retrievedMemoryIds array required' },
        { status: 400 }
      )
    }

    console.log('[Memory Feedback] Session:', sessionId,
      'Retrieved:', retrievedMemoryIds.length,
      'Cited:', citedMemoryIds.length)

    const citedSet = new Set(citedMemoryIds)
    let positiveUpdates = 0
    let negativeUpdates = 0

    // Process each retrieved memory
    for (const memoryId of retrievedMemoryIds) {
      const wasCited = citedSet.has(memoryId)

      // Try to update in user_memories first, then carl_relational_memories
      // Use the PostgreSQL function for RL update
      try {
        await execute(`SELECT update_memory_rl($1, $2)`, [memoryId, wasCited])

        if (wasCited) {
          positiveUpdates++
        } else {
          negativeUpdates++
        }
      } catch (err) {
        // Memory might be in carl_relational_memories instead
        // The SQL function should handle this, but log any errors
        console.warn('[Memory Feedback] Could not update memory:', memoryId, err)
      }
    }

    // Log feedback for analytics
    await execute(`
      INSERT INTO memory_feedback_log (session_id, user_id, retrieved_count, cited_count, timestamp)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT DO NOTHING
    `, [sessionId, userId, retrievedMemoryIds.length, citedMemoryIds.length]).catch(() => {
      // Table might not exist yet - not critical
    })

    console.log('[Memory Feedback] Updated:', positiveUpdates, 'positive,', negativeUpdates, 'negative')

    return NextResponse.json({
      success: true,
      updates: {
        positive: positiveUpdates,
        negative: negativeUpdates,
        total: retrievedMemoryIds.length,
      },
    })

  } catch (error) {
    console.error('[Memory Feedback] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Feedback failed' },
      { status: 500 }
    )
  }
}

// GET: Check memory effectiveness stats
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id') || 'brandon'

  try {
    // Get memory effectiveness distribution based on memory_strength
    const stats = await query(`
      SELECT
        CASE
          WHEN memory_strength >= 3.0 THEN 'high'
          WHEN memory_strength >= 2.0 THEN 'medium'
          ELSE 'low'
        END as strength_tier,
        COUNT(*) as count,
        AVG(times_cited) as avg_citations,
        AVG(times_retrieved_unused) as avg_unused,
        AVG(memory_strength) as avg_strength
      FROM user_memories
      WHERE user_id = $1 AND is_current = true
      GROUP BY strength_tier
      ORDER BY strength_tier
    `, [userId])

    // Get top performers by memory strength and citations
    const topMemories = await query(`
      SELECT id, summary, times_cited, memory_strength, current_importance, emotional_arousal
      FROM user_memories
      WHERE user_id = $1 AND is_current = true
      ORDER BY memory_strength DESC, times_cited DESC
      LIMIT 5
    `, [userId])

    return NextResponse.json({
      success: true,
      userId,
      stats,
      topMemories,
    })

  } catch (error) {
    console.error('[Memory Feedback] Stats error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get stats' },
      { status: 500 }
    )
  }
}
