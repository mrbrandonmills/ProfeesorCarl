/**
 * MEMORY RETRIEVAL FOR CONVERSATIONS
 * Fetches permanent memories for use in chat/voice sessions
 */

import { query, vectorSearch } from '@/lib/db/postgres'
import { generateEmbedding } from '@/lib/ai/embeddings'

export interface MemoryContext {
  userFacts: Array<{
    id: string
    fact: string
    category: string
    emotionalArousal: number
    dominantEmotion: string
    memoryStrength: number
  }>
  carlMemories: Array<{
    id: string
    memory: string
    type: string
    effectiveness: number | null
  }>
  teachingApproaches: Array<{
    approach: string
    effectiveness: number
  }>
  retrievedMemoryIds: string[]
}

/**
 * Retrieve memory context for a user
 * Used by chat and voice routes to give Carl access to permanent memories
 */
export async function retrieveMemoryContext(
  userId: string,
  topic?: string,
  limit: number = 10
): Promise<MemoryContext> {
  try {
    // If topic provided, use semantic search
    let topicEmbedding: number[] | null = null
    if (topic) {
      topicEmbedding = await generateEmbedding(topic)
    }

    // Get user facts using hybrid retrieval with cognitive scoring
    let userFacts
    if (topicEmbedding) {
      const embeddingStr = `[${topicEmbedding.join(',')}]`
      userFacts = await query(`
        SELECT * FROM retrieve_memories_hybrid($1, $2::vector, $3, NULL)
      `, [userId, embeddingStr, limit])
    } else {
      userFacts = await query(`
        SELECT * FROM retrieve_memories_hybrid($1, NULL, $2, NULL)
      `, [userId, limit])
    }

    // Get Carl's relational memories
    let carlMemories
    if (topicEmbedding) {
      carlMemories = await vectorSearch(
        'carl_relational_memories',
        topicEmbedding,
        {
          limit: 5,
          where: `user_id = '${userId}'`,
          selectFields: 'id, content, summary, memory_type, effectiveness_score',
        }
      )
    } else {
      carlMemories = await query(`
        SELECT id, content, summary, memory_type, effectiveness_score
        FROM carl_relational_memories
        WHERE user_id = $1
        ORDER BY memory_strength DESC, occurred_at DESC
        LIMIT 5
      `, [userId])
    }

    // Get successful teaching approaches
    const teachingApproaches = await query(`
      SELECT content, summary, effectiveness_score
      FROM carl_relational_memories
      WHERE user_id = $1
        AND memory_type = 'teaching_success'
        AND effectiveness_score > 0.5
      ORDER BY effectiveness_score DESC
      LIMIT 3
    `, [userId])

    return {
      userFacts: userFacts.map((f: any) => ({
        id: f.id,
        fact: f.summary || f.content,
        category: f.category,
        emotionalArousal: f.emotional_arousal,
        dominantEmotion: f.dominant_emotion,
        memoryStrength: f.memory_strength,
      })),
      carlMemories: carlMemories.map((m: any) => ({
        id: m.id,
        memory: m.summary || m.content,
        type: m.memory_type,
        effectiveness: m.effectiveness_score,
      })),
      teachingApproaches: teachingApproaches.map((a: any) => ({
        approach: a.summary || a.content,
        effectiveness: a.effectiveness_score,
      })),
      retrievedMemoryIds: [
        ...userFacts.map((f: any) => f.id),
        ...carlMemories.map((m: any) => m.id),
      ].filter(Boolean),
    }
  } catch (error) {
    console.error('[Memory Retrieval] Error:', error)
    // Return empty context on error so chat can still work
    return {
      userFacts: [],
      carlMemories: [],
      teachingApproaches: [],
      retrievedMemoryIds: [],
    }
  }
}

/**
 * Format memory context as a string for injection into conversation
 */
export function formatMemoryContextForPrompt(context: MemoryContext): string {
  if (context.userFacts.length === 0 && context.carlMemories.length === 0) {
    return ''
  }

  const parts: string[] = []

  if (context.userFacts.length > 0) {
    parts.push('## What I Know About This Student:')
    context.userFacts.forEach(f => {
      const emotionTag = f.dominantEmotion !== 'neutral' ? ` [${f.dominantEmotion}]` : ''
      parts.push(`- ${f.fact}${emotionTag}`)
    })
  }

  if (context.teachingApproaches.length > 0) {
    parts.push('\n## Teaching Approaches That Work:')
    context.teachingApproaches.forEach(a => {
      parts.push(`- ${a.approach}`)
    })
  }

  if (context.carlMemories.length > 0) {
    parts.push('\n## My Notes About Our Relationship:')
    context.carlMemories.forEach(m => {
      parts.push(`- ${m.memory}`)
    })
  }

  return parts.join('\n')
}
