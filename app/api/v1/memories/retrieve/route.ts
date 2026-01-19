/**
 * CROSS-APP MEMORY RETRIEVAL ENDPOINT
 *
 * Allows ANCHOR (DefiantFinance) to fetch Professor Carl's memories
 * about a user for bidirectional memory sharing.
 *
 * Mirrors the endpoint format used by ANCHOR's /api/v1/memories/retrieve
 */

import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { retrieveMemoryContext } from '@/lib/memory/retrieval'

const CROSS_APP_SECRET = process.env.CROSS_APP_SECRET

// Validation constants
const MAX_LIMIT = 100
const MIN_LIMIT = 1
const MAX_QUERY_LENGTH = 2000

interface RetrieveRequest {
  user_id: string
  email?: string // Optional email for fallback lookup (cross-app sync)
  query?: string
  limit?: number
  include_carl_memories?: boolean
}

export async function POST(request: NextRequest) {
  try {
    // Validate cross-app secret
    const crossAppSecret = request.headers.get('x-cross-app-secret')

    if (!CROSS_APP_SECRET) {
      console.error('[Cross-App Memory] CROSS_APP_SECRET not configured')
      return NextResponse.json(
        { error: 'Server not configured for cross-app requests' },
        { status: 500 }
      )
    }

    // Constant-time comparison using Node.js crypto (prevents timing attacks)
    if (!crossAppSecret || !safeCompare(crossAppSecret, CROSS_APP_SECRET)) {
      console.warn('[Cross-App Memory] Invalid or missing cross-app secret')
      return NextResponse.json(
        { error: 'Invalid cross-app secret' },
        { status: 401 }
      )
    }

    const body: RetrieveRequest = await request.json()
    const { user_id, email, query, limit: rawLimit = 10, include_carl_memories = true } = body

    // Validate user_id format (alphanumeric, hyphens, underscores only)
    if (!user_id || !/^[a-zA-Z0-9_-]+$/.test(user_id)) {
      return NextResponse.json(
        { error: 'Invalid user_id format' },
        { status: 400 }
      )
    }

    // Validate email format if provided (for fallback lookup)
    const emailPrefix = email?.split('@')[0]?.toLowerCase()
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate and clamp limit to prevent abuse
    const limit = Math.min(Math.max(MIN_LIMIT, rawLimit), MAX_LIMIT)

    // Validate query length
    if (query && query.length > MAX_QUERY_LENGTH) {
      return NextResponse.json(
        { error: `Query too long (max ${MAX_QUERY_LENGTH} characters)` },
        { status: 400 }
      )
    }

    console.log(`[Cross-App Memory] Fetching memories for user: ${user_id}, email: ${email || 'none'}, query: "${query?.slice(0, 50) || 'none'}", limit: ${limit}`)

    // Use existing retrieval function - try user_id first
    let context = await retrieveMemoryContext(
      user_id,
      query || undefined,
      limit,
      [] // No conversation context for cross-app requests
    )

    // If no memories found and email provided, try email prefix as fallback
    // This enables cross-app sync when user_id formats differ (e.g., Firebase UID vs "brandon")
    const hasNoResults = context.userFacts.length === 0 && context.carlMemories.length === 0
    if (hasNoResults && emailPrefix && emailPrefix !== user_id) {
      console.log(`[Cross-App Memory] No memories for ${user_id}, trying email prefix: ${emailPrefix}`)
      context = await retrieveMemoryContext(
        emailPrefix,
        query || undefined,
        limit,
        []
      )
    }

    // Transform to snake_case for Python compatibility
    const response = {
      user_memories: context.userFacts.map(f => ({
        id: f.id,
        content: f.fact,
        summary: f.fact,
        category: f.category,
        emotional_arousal: f.emotionalArousal,
        dominant_emotion: f.dominantEmotion,
        memory_strength: f.memoryStrength,
        current_importance: f.memoryStrength, // Use strength as importance
      })),
      carl_memories: include_carl_memories ? context.carlMemories.map(m => ({
        id: m.id,
        content: m.memory,
        summary: m.memory,
        memory_type: m.type,
        effectiveness_score: m.effectiveness,
      })) : [],
      teaching_strategies: context.teachingStrategies.map(s => ({
        topic: s.topic,
        strategy_used: s.strategyUsed,
        success_score: s.successScore,
        evidence: s.evidence,
      })),
      teaching_approaches: context.teachingApproaches.map(a => ({
        approach: a.approach,
        effectiveness: a.effectiveness,
      })),
      success: true,
    }

    console.log(`[Cross-App Memory] Returning ${response.user_memories.length} user memories, ${response.carl_memories.length} Carl memories, ${response.teaching_strategies.length} strategies`)

    return NextResponse.json(response)
  } catch (error) {
    console.error('[Cross-App Memory] Error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to retrieve memories',
        success: false,
      },
      { status: 500 }
    )
  }
}

/**
 * Constant-time string comparison using Node.js crypto
 * Prevents timing attacks on secret comparison
 */
function safeCompare(a: string, b: string): boolean {
  try {
    const aBuffer = Buffer.from(a)
    const bBuffer = Buffer.from(b)

    // If lengths differ, still do a comparison to avoid timing leak
    if (aBuffer.length !== bBuffer.length) {
      // Compare against itself to maintain constant time
      timingSafeEqual(aBuffer, aBuffer)
      return false
    }

    return timingSafeEqual(aBuffer, bBuffer)
  } catch {
    return false
  }
}
