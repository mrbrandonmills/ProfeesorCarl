/**
 * MEMORY STATUS ENDPOINT
 * Returns memory counts and cross-app sync status for welcome confirmation
 *
 * GET /api/memory/status?user_id={userId}
 *
 * Query Parameters:
 *   user_id: string - User identifier (alphanumeric, hyphens, underscores only)
 *                     Defaults to 'brandon' if not provided
 *
 * Success Response (200):
 * {
 *   userId: string,              // The user_id that was queried
 *   userMemories: number,        // Count from user_memories table (user facts)
 *   carlMemories: number,        // Count from carl_relational_memories table
 *   anchorMemories: number,      // Combined count from ANCHOR (user + relational)
 *   totalMemories: number,       // Sum of all memory counts
 *   anchorSyncConnected: boolean,// true if ANCHOR API is reachable
 *   timestamp: string,           // ISO 8601 timestamp
 *   success: true
 * }
 *
 * Error Response (400 - Invalid user_id):
 * { error: 'Invalid user_id format', success: false }
 *
 * Error Response (500 - Server error):
 * { userId, totalMemories: 0, anchorSyncConnected: false, success: false, error: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/postgres'
import { fetchAnchorMemories } from '@/lib/memory/unified'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id') || 'brandon'

  // Input validation - only allow alphanumeric, hyphens, underscores
  if (!/^[a-zA-Z0-9_-]+$/.test(userId)) {
    return NextResponse.json(
      { error: 'Invalid user_id format', success: false },
      { status: 400 }
    )
  }

  try {
    // Count Carl's user memories
    const userFactsResult = await query(`
      SELECT COUNT(*) as count FROM user_memories WHERE user_id = $1
    `, [userId])
    const userMemoriesCount = parseInt(userFactsResult[0]?.count) || 0

    // Count Carl's relational memories
    const carlMemoriesResult = await query(`
      SELECT COUNT(*) as count FROM carl_relational_memories WHERE user_id = $1
    `, [userId])
    const carlMemoriesCount = parseInt(carlMemoriesResult[0]?.count) || 0

    // Try to get ANCHOR memories (cross-app sync check)
    let anchorCount = 0
    let anchorSyncConnected = false
    try {
      const anchorContext = await fetchAnchorMemories(userId, undefined, 1)
      if (anchorContext.success) {
        anchorCount = anchorContext.userMemories.length + anchorContext.anchorMemories.length
        anchorSyncConnected = true
      }
    } catch (e) {
      console.log('[Memory Status] ANCHOR sync check failed (non-critical):', e)
    }

    const totalMemories = userMemoriesCount + carlMemoriesCount + anchorCount

    return NextResponse.json({
      userId,
      userMemories: userMemoriesCount,
      carlMemories: carlMemoriesCount,
      anchorMemories: anchorCount,
      totalMemories,
      anchorSyncConnected,
      timestamp: new Date().toISOString(),
      success: true
    })
  } catch (error) {
    console.error('[Memory Status] Error:', error)
    return NextResponse.json({
      userId,
      totalMemories: 0,
      anchorSyncConnected: false,
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get memory status'
    }, { status: 500 })
  }
}
