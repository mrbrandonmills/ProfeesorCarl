// ===========================================
// MEMORY DECAY CRON JOB - Ebbinghaus Forgetting Curve
// ===========================================
// Applies time-based decay to memory importance
// Formula: current_importance = memory_strength × e^(-Δt/S)
// Run via Vercel Cron or external scheduler

import { NextRequest, NextResponse } from 'next/server'
import { execute, query } from '@/lib/db/postgres'

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: NextRequest) {
  // Verify authorization (for Vercel Cron or external scheduler)
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[Memory Decay] Starting decay update...')

    // Update user_memories - apply Ebbinghaus forgetting curve
    const userResult = await execute(`
      UPDATE user_memories
      SET
        current_importance = apply_forgetting_curve(memory_strength, last_referenced_at),
        last_decay_update = NOW()
      WHERE last_decay_update < NOW() - INTERVAL '1 hour'
        AND is_current = true
    `)

    // Update carl_relational_memories
    const carlResult = await execute(`
      UPDATE carl_relational_memories
      SET
        current_importance = apply_forgetting_curve(memory_strength, occurred_at),
        last_decay_update = NOW()
      WHERE last_decay_update < NOW() - INTERVAL '1 hour'
    `)

    // Get decay statistics
    const stats = await query(`
      SELECT
        'user_memories' as table_name,
        COUNT(*) as total,
        AVG(current_importance) as avg_importance,
        MIN(current_importance) as min_importance,
        MAX(current_importance) as max_importance
      FROM user_memories
      WHERE is_current = true
      UNION ALL
      SELECT
        'carl_relational_memories' as table_name,
        COUNT(*) as total,
        AVG(current_importance) as avg_importance,
        MIN(current_importance) as min_importance,
        MAX(current_importance) as max_importance
      FROM carl_relational_memories
    `)

    // Identify memories that have significantly decayed (for potential cleanup)
    const decayedMemories = await query(`
      SELECT id, summary, current_importance, memory_strength
      FROM user_memories
      WHERE is_current = true
        AND current_importance < 0.1
        AND memory_strength < 1.0
      ORDER BY current_importance ASC
      LIMIT 10
    `)

    console.log('[Memory Decay] Completed. Stats:', JSON.stringify(stats))

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
      decayedMemories: decayedMemories.length,
      message: 'Decay update completed',
    })

  } catch (error) {
    console.error('[Memory Decay] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Decay update failed' },
      { status: 500 }
    )
  }
}

// POST: Force refresh all memory importance scores
export async function POST(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[Memory Decay] Force refreshing all memory scores...')

    // Recalculate memory_strength for all user memories using LUFY formula
    await execute(`
      UPDATE user_memories
      SET
        memory_strength = calculate_memory_strength(
          emotional_arousal,
          llm_importance,
          reference_count,
          times_retrieved_unused
        ),
        current_importance = apply_forgetting_curve(
          calculate_memory_strength(
            emotional_arousal,
            llm_importance,
            reference_count,
            times_retrieved_unused
          ),
          last_referenced_at
        ),
        last_decay_update = NOW()
      WHERE is_current = true
    `)

    // Same for Carl memories
    await execute(`
      UPDATE carl_relational_memories
      SET
        memory_strength = calculate_memory_strength(
          emotional_arousal,
          llm_importance,
          times_used,
          times_retrieved_unused
        ),
        current_importance = apply_forgetting_curve(
          calculate_memory_strength(
            emotional_arousal,
            llm_importance,
            times_used,
            times_retrieved_unused
          ),
          occurred_at
        ),
        last_decay_update = NOW()
    `)

    console.log('[Memory Decay] Force refresh completed')

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'All memory scores recalculated',
    })

  } catch (error) {
    console.error('[Memory Decay] Force refresh error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Force refresh failed' },
      { status: 500 }
    )
  }
}
