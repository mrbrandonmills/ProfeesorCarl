/**
 * MEMORY RETRIEVAL FOR CONVERSATIONS
 * Fetches permanent memories for use in chat/voice sessions
 *
 * Enhanced with 2026 research features:
 * - Query Construction: Expand user query into optimized search queries
 * - Reranking: Reorder results by actual relevance to current question
 */

import { query, vectorSearch } from '@/lib/db/postgres'
import { generateEmbedding } from '@/lib/ai/embeddings'
import Anthropic from '@anthropic-ai/sdk'
import { getRelevantStrategies, formatStrategiesForPrompt, TeachingStrategy } from './experiential'

const anthropic = new Anthropic()

/**
 * Query Construction - Expand user query into multiple optimized search queries
 * Based on 2026 research: "The agent shouldn't just search the user's query"
 */
async function expandQueryForMemorySearch(
  userMessage: string,
  conversationContext: string[]
): Promise<string[]> {
  try {
    const prompt = `You are helping retrieve memories for Professor Carl, an AI tutor.

USER'S CURRENT MESSAGE: "${userMessage}"
RECENT CONVERSATION CONTEXT:
${conversationContext.slice(-3).map((m, i) => `${i + 1}. ${m}`).join('\n') || 'Start of conversation'}

Generate 3-5 search queries that would find relevant memories about this student. Think about:
1. The LITERAL topic they're asking about
2. RELATED concepts they might have struggled with before
3. LEARNING PREFERENCES that would help (visual, examples, step-by-step, etc.)
4. EMOTIONAL CONTEXT (anxiety, confidence, past breakthroughs)
5. PERSONAL CONTEXT (goals, background, interests)

Output ONLY a JSON array of strings, no explanation:
["query1", "query2", "query3"]`

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 150,
      messages: [{ role: 'user', content: prompt }]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '[]'
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return [userMessage]

    const queries = JSON.parse(jsonMatch[0]) as string[]
    console.log(`[Query Construction] Expanded "${userMessage.slice(0, 30)}..." into ${queries.length} queries`)
    return queries.length > 0 ? queries : [userMessage]
  } catch (error) {
    console.error('[Query Construction] Error:', error)
    return [userMessage] // Fallback to original query
  }
}

/**
 * Reranking - Reorder retrieved memories by actual relevance
 * Based on 2026 research: "Always rerank retrieved chunks using a Cross-Encoder"
 */
async function rerankMemories(
  memories: Array<{ id: string; content: string; score?: number }>,
  currentQuery: string,
  conversationContext: string
): Promise<Array<{ id: string; content: string; score?: number }>> {
  if (memories.length <= 3) return memories // Not worth reranking small sets

  try {
    const prompt = `You are reranking memories for relevance to the current tutoring question.

CURRENT QUESTION: "${currentQuery}"
CONVERSATION CONTEXT: ${conversationContext || 'Start of session'}

RETRIEVED MEMORIES:
${memories.map((m, i) => `[${i}] ${m.content}`).join('\n')}

Rank these by how DIRECTLY USEFUL they are for answering the current question.
Consider:
1. Direct topical relevance (highest weight)
2. Learning style preferences that apply
3. Emotional context that might help
4. Past breakthroughs in similar topics

Output ONLY a JSON object with indices in order of relevance:
{ "ranking": [2, 5, 1, 0, 3, 4] }`

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 100,
      messages: [{ role: 'user', content: prompt }]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return memories

    const { ranking } = JSON.parse(jsonMatch[0]) as { ranking: number[] }
    const reranked = ranking
      .map((i: number) => memories[i])
      .filter(Boolean)

    // Add any memories that weren't in the ranking
    const rerankedIds = new Set(reranked.map(m => m.id))
    const missing = memories.filter(m => !rerankedIds.has(m.id))

    console.log(`[Reranking] Reordered ${memories.length} memories`)
    return [...reranked, ...missing]
  } catch (error) {
    console.error('[Reranking] Error:', error)
    return memories // Fallback to original order
  }
}

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
  // Experiential Memory - teaching strategies that worked
  teachingStrategies: TeachingStrategy[]
  retrievedMemoryIds: string[]
}

/**
 * Retrieve memory context for a user
 * Used by chat and voice routes to give Carl access to permanent memories
 *
 * Enhanced with:
 * - Query Construction: Expands user topic into multiple optimized searches
 * - Reranking: Reorders results by actual relevance to current question
 */
export async function retrieveMemoryContext(
  userId: string,
  topic?: string,
  limit: number = 10,
  conversationContext: string[] = []
): Promise<MemoryContext> {
  try {
    // 1. Query Construction - Expand topic into multiple search queries
    let searchQueries: string[] = []
    if (topic) {
      searchQueries = await expandQueryForMemorySearch(topic, conversationContext)
    }

    // 2. Search with multiple queries and merge results
    const allUserFacts: Map<string, any> = new Map()

    if (searchQueries.length > 0) {
      // Search with each expanded query
      for (const searchQuery of searchQueries) {
        const queryEmbedding = await generateEmbedding(searchQuery)
        const embeddingStr = `[${queryEmbedding.join(',')}]`

        const results = await query(`
          SELECT * FROM retrieve_memories_hybrid($1, $2::vector, $3, NULL)
        `, [userId, embeddingStr, Math.ceil(limit / searchQueries.length) + 2])

        // Merge results, avoiding duplicates
        for (const fact of results) {
          if (!allUserFacts.has(fact.id)) {
            allUserFacts.set(fact.id, fact)
          }
        }
      }
    } else {
      // No topic - get by importance
      const results = await query(`
        SELECT * FROM retrieve_memories_hybrid($1, NULL, $2, NULL)
      `, [userId, limit])

      for (const fact of results) {
        allUserFacts.set(fact.id, fact)
      }
    }

    // 3. Rerank user facts by relevance to current topic
    let userFactsArray = Array.from(allUserFacts.values())
    if (topic && userFactsArray.length > 3) {
      const factsForReranking = userFactsArray.map(f => ({
        id: f.id,
        content: f.summary || f.content,
        score: f.memory_strength
      }))

      const rerankedFacts = await rerankMemories(
        factsForReranking,
        topic,
        conversationContext.join(' ')
      )

      // Reorder userFactsArray based on reranking
      const rerankedOrder = new Map(rerankedFacts.map((f, i) => [f.id, i]))
      userFactsArray.sort((a, b) => {
        const orderA = rerankedOrder.get(a.id) ?? Infinity
        const orderB = rerankedOrder.get(b.id) ?? Infinity
        return orderA - orderB
      })
    }

    // Limit to requested amount
    const userFacts = userFactsArray.slice(0, limit)

    // 4. Get Carl's relational memories
    let carlMemories
    if (topic) {
      const topicEmbedding = await generateEmbedding(topic)
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

    // Get successful teaching approaches (legacy)
    const teachingApproaches = await query(`
      SELECT content, summary, effectiveness_score
      FROM carl_relational_memories
      WHERE user_id = $1
        AND memory_type = 'teaching_success'
        AND effectiveness_score > 0.5
      ORDER BY effectiveness_score DESC
      LIMIT 3
    `, [userId])

    // 5. Get experiential teaching strategies
    const teachingStrategies = await getRelevantStrategies(userId, topic, 3)

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
      teachingStrategies,
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
      teachingStrategies: [],
      retrievedMemoryIds: [],
    }
  }
}

/**
 * Format memory context as a string for injection into conversation
 */
export function formatMemoryContextForPrompt(context: MemoryContext): string {
  if (context.userFacts.length === 0 && context.carlMemories.length === 0 && context.teachingStrategies.length === 0) {
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

  // Experiential Memory - Teaching strategies that worked
  if (context.teachingStrategies.length > 0) {
    parts.push('\n## Teaching Strategies That Work For This Student:')
    context.teachingStrategies.forEach(s => {
      const successPct = Math.round((s.successScore ?? 0.5) * 100)
      parts.push(`- **${s.topic}**: Use ${s.strategyUsed} (${successPct}% success rate)`)
      if (s.evidence) {
        parts.push(`  _Evidence: "${s.evidence.slice(0, 80)}..."_`)
      }
    })
  }

  if (context.teachingApproaches.length > 0) {
    parts.push('\n## Other Teaching Approaches That Work:')
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
