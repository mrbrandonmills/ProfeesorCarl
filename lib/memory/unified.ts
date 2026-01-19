/**
 * UNIFIED MEMORY SERVICE
 * Fetches memories from both Professor Carl and ANCHOR backends
 *
 * This mirrors the mobile app's UnifiedMemoryService pattern
 * so web users get the same cross-app memory experience.
 */

import { MemoryContext, retrieveMemoryContext, formatMemoryContextForPrompt } from './retrieval'

const ANCHOR_API_URL = process.env.ANCHOR_API_URL || 'https://defiantfinance-production.up.railway.app'
const CROSS_APP_SECRET = process.env.CROSS_APP_SECRET

export interface AnchorMemory {
  id: string
  content: string
  summary: string
  memoryType: string
  emotionalArousal: number
  dominantEmotion: string
  memoryStrength: number
  effectivenessScore: number
}

export interface AnchorUserMemory {
  id: string
  content: string
  summary: string
  category: string
  emotionalArousal: number
  dominantEmotion: string
  memoryStrength: number
  currentImportance: number
}

export interface AnchorMemoryContext {
  userMemories: AnchorUserMemory[]
  anchorMemories: AnchorMemory[]
  success: boolean
}

export interface UnifiedMemoryContext extends MemoryContext {
  anchorUserMemories: AnchorUserMemory[]
  anchorRelationalMemories: AnchorMemory[]
}

/**
 * Fetch memories from ANCHOR backend
 * Returns empty context if ANCHOR is unreachable (graceful degradation)
 */
export async function fetchAnchorMemories(
  userId: string,
  query?: string,
  limit: number = 5
): Promise<AnchorMemoryContext> {
  // If no secret configured, skip ANCHOR fetch
  if (!CROSS_APP_SECRET) {
    console.log('[Unified Memory] CROSS_APP_SECRET not configured, skipping ANCHOR fetch')
    return { userMemories: [], anchorMemories: [], success: false }
  }

  try {
    const response = await fetch(`${ANCHOR_API_URL}/api/v1/memories/retrieve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Cross-App-Secret': CROSS_APP_SECRET
      },
      body: JSON.stringify({
        user_id: userId,
        query: query || null,
        limit,
        include_anchor_memories: true
      }),
      // Timeout after 5 seconds - don't let ANCHOR slowness block Carl
      signal: AbortSignal.timeout(5000)
    })

    if (!response.ok) {
      console.error(`[Unified Memory] ANCHOR returned ${response.status}`)
      return { userMemories: [], anchorMemories: [], success: false }
    }

    const data = await response.json()

    // Transform snake_case to camelCase
    const userMemories: AnchorUserMemory[] = (data.user_memories || []).map((m: any) => ({
      id: m.id,
      content: m.content,
      summary: m.summary,
      category: m.category,
      emotionalArousal: m.emotional_arousal,
      dominantEmotion: m.dominant_emotion,
      memoryStrength: m.memory_strength,
      currentImportance: m.current_importance,
    }))

    const anchorMemories: AnchorMemory[] = (data.anchor_memories || []).map((m: any) => ({
      id: m.id,
      content: m.content,
      summary: m.summary,
      memoryType: m.memory_type,
      emotionalArousal: m.emotional_arousal,
      dominantEmotion: m.dominant_emotion,
      memoryStrength: m.memory_strength,
      effectivenessScore: m.effectiveness_score,
    }))

    console.log(`[Unified Memory] ANCHOR returned ${userMemories.length} user + ${anchorMemories.length} relational memories`)

    return { userMemories, anchorMemories, success: true }
  } catch (error) {
    // Graceful degradation - ANCHOR being down shouldn't break Carl
    console.error('[Unified Memory] Failed to fetch from ANCHOR:', error)
    return { userMemories: [], anchorMemories: [], success: false }
  }
}

/**
 * Get unified memory context from both Carl and ANCHOR
 * Fetches in parallel for performance
 */
export async function getUnifiedMemoryContext(
  userId: string,
  topic?: string,
  limit: number = 10,
  conversationContext: string[] = []
): Promise<UnifiedMemoryContext> {
  // Fetch from both sources in parallel
  const [carlContext, anchorContext] = await Promise.all([
    retrieveMemoryContext(userId, topic, Math.ceil(limit * 0.7), conversationContext),
    fetchAnchorMemories(userId, topic, Math.ceil(limit * 0.5))
  ])

  return {
    ...carlContext,
    anchorUserMemories: anchorContext.userMemories,
    anchorRelationalMemories: anchorContext.anchorMemories,
    // Merge retrieved IDs
    retrievedMemoryIds: [
      ...carlContext.retrievedMemoryIds,
      ...anchorContext.userMemories.map(m => `anchor-user-${m.id}`),
      ...anchorContext.anchorMemories.map(m => `anchor-rel-${m.id}`),
    ]
  }
}

/**
 * Format unified memory context for prompt injection
 * Includes both Carl and ANCHOR memories
 */
export function formatUnifiedMemoryContextForPrompt(context: UnifiedMemoryContext): string {
  // Start with Carl's standard format
  const carlSection = formatMemoryContextForPrompt(context)

  // Build ANCHOR section if we have memories
  const anchorParts: string[] = []

  if (context.anchorUserMemories.length > 0 || context.anchorRelationalMemories.length > 0) {
    anchorParts.push('\n## From ANCHOR (Financial Coaching):')

    // Add user facts from ANCHOR
    if (context.anchorUserMemories.length > 0) {
      anchorParts.push('### What ANCHOR Knows:')
      context.anchorUserMemories.forEach(m => {
        const emotionTag = m.dominantEmotion !== 'neutral' ? ` [${m.dominantEmotion}]` : ''
        anchorParts.push(`- ${m.summary || m.content}${emotionTag}`)
      })
    }

    // Add relational memories (coaching insights)
    if (context.anchorRelationalMemories.length > 0) {
      anchorParts.push('\n### Financial Coaching Insights:')
      context.anchorRelationalMemories.forEach(m => {
        const typeLabel = m.memoryType === 'breakthrough' ? '💡' :
                         m.memoryType === 'concern' ? '⚠️' :
                         m.memoryType === 'teaching_success' ? '✓' : '•'
        anchorParts.push(`${typeLabel} ${m.summary || m.content}`)
      })
    }
  }

  return carlSection + anchorParts.join('\n')
}
