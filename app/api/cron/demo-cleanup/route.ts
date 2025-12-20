// ===========================================
// DEMO CLEANUP CRON JOB
// ===========================================
// Cleans up old demo session records to prevent database bloat
// Run via Vercel Cron (recommended: daily at 3 AM UTC)

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

  const cutoffDays = 7 // Delete demo records older than 7 days
  const deleted = {
    userMemories: 0,
    carlMemories: 0,
    sessions: 0,
    messages: 0,
  }

  try {
    console.log('[Demo Cleanup] Starting cleanup of demo records older than', cutoffDays, 'days...')

    // Delete old demo user memories
    deleted.userMemories = await execute(`
      DELETE FROM user_memories
      WHERE user_id LIKE 'demo-user-%'
      AND created_at < NOW() - INTERVAL '${cutoffDays} days'
    `)

    // Delete old demo Carl relational memories
    deleted.carlMemories = await execute(`
      DELETE FROM carl_relational_memories
      WHERE user_id LIKE 'demo-user-%'
      AND created_at < NOW() - INTERVAL '${cutoffDays} days'
    `)

    // Delete old demo voice sessions (if voice_sessions table exists)
    try {
      deleted.sessions = await execute(`
        DELETE FROM voice_sessions
        WHERE user_id LIKE 'demo-user-%'
        AND created_at < NOW() - INTERVAL '${cutoffDays} days'
      `)
    } catch (e) {
      // Table may not exist yet
      console.log('[Demo Cleanup] voice_sessions table not found, skipping')
    }

    // Delete old demo session messages (via sessions table with is_demo flag)
    try {
      deleted.messages = await execute(`
        DELETE FROM messages m
        USING sessions s
        WHERE m.session_id = s.id
        AND s.is_demo = true
        AND s.created_at < NOW() - INTERVAL '${cutoffDays} days'
      `)
    } catch (e) {
      // Tables may not have is_demo column
      console.log('[Demo Cleanup] is_demo column not found, skipping messages cleanup')
    }

    // Get count of remaining demo records for monitoring
    const remaining = await query(`
      SELECT
        (SELECT COUNT(*) FROM user_memories WHERE user_id LIKE 'demo-user-%') as demo_user_memories,
        (SELECT COUNT(*) FROM carl_relational_memories WHERE user_id LIKE 'demo-user-%') as demo_carl_memories
    `)

    console.log('[Demo Cleanup] Completed. Deleted:', JSON.stringify(deleted))

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      deleted,
      remaining: remaining[0],
      cutoffDays,
      message: 'Demo cleanup completed',
    })

  } catch (error) {
    console.error('[Demo Cleanup] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cleanup failed' },
      { status: 500 }
    )
  }
}

// POST: Manual cleanup with custom cutoff
export async function POST(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { cutoffDays = 7 } = await request.json()

    console.log('[Demo Cleanup] Manual cleanup with cutoff:', cutoffDays, 'days')

    const deleted = {
      userMemories: 0,
      carlMemories: 0,
    }

    deleted.userMemories = await execute(`
      DELETE FROM user_memories
      WHERE user_id LIKE 'demo-user-%'
      AND created_at < NOW() - INTERVAL '${cutoffDays} days'
    `)

    deleted.carlMemories = await execute(`
      DELETE FROM carl_relational_memories
      WHERE user_id LIKE 'demo-user-%'
      AND created_at < NOW() - INTERVAL '${cutoffDays} days'
    `)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      deleted,
      cutoffDays,
      message: 'Manual cleanup completed',
    })

  } catch (error) {
    console.error('[Demo Cleanup] Manual cleanup error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Manual cleanup failed' },
      { status: 500 }
    )
  }
}
