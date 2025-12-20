/**
 * CONVERSATION MEMORY SAVER
 * Bridges the gap between chat/voice sessions and the permanent memory system
 * Extracts important facts and saves them with cognitive scoring
 */

import { extractMemoriesFromConversation } from './extraction'
import { execute, queryOne } from '@/lib/db/postgres'
import { calculateMemoryStrength } from './hume-emotions'

interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  emotions?: Record<string, number>
  dominant_emotion?: string
  emotion_intensity?: number
}

interface SaveResult {
  userMemoriesSaved: number
  carlMemoriesSaved: number
  sessionSaved: boolean
  error?: string
}

/**
 * Process and save memories from a conversation
 * Call this at the end of chat sessions or voice sessions
 */
export async function saveConversationMemories(
  userId: string,
  sessionId: string,
  messages: ConversationMessage[],
  sessionData?: {
    topic?: string
    durationSeconds?: number
    engagementScore?: number
    breakthroughCount?: number
  }
): Promise<SaveResult> {
  const result: SaveResult = {
    userMemoriesSaved: 0,
    carlMemoriesSaved: 0,
    sessionSaved: false,
  }

  if (!messages || messages.length < 2) {
    console.log('[Memory Save] Not enough messages to extract memories')
    return result
  }

  try {
    // 1. Extract memories from conversation using Claude
    console.log(`[Memory Save] Extracting memories from ${messages.length} messages for user ${userId}`)

    let extracted
    try {
      extracted = await extractMemoriesFromConversation(
        messages.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
          emotions: m.emotions,
          dominant_emotion: m.dominant_emotion,
          emotion_intensity: m.emotion_intensity,
        }))
      )
      console.log(`[Memory Save] Extraction returned: ${extracted.brandonMemories.length} Brandon, ${extracted.carlMemories.length} Carl memories`)
    } catch (extractError) {
      console.error('[Memory Save] Extraction FAILED:', extractError)
      return result
    }

    // 2. Save user memories (Brandon facts)
    for (const memory of extracted.brandonMemories) {
      try {
        const memoryStrength = calculateMemoryStrength({
          timesCited: 0,
          humeArousal: memory.emotional_arousal,
          textArousal: memory.emotional_arousal,
          llmImportance: memory.llm_importance,
          timesRetrievedUnused: 0,
        })

        const embeddingStr = `[${memory.embedding.join(',')}]`

        await execute(`
          INSERT INTO user_memories
          (user_id, content, summary, category, embedding, confidence, source_session_id, source_type,
           emotional_arousal, emotional_valence, dominant_emotion, llm_importance,
           memory_strength, current_importance, granularity, perplexity)
          VALUES ($1, $2, $3, $4, $5::vector, $6, $7, 'conversation',
                  $8, $9, $10, $11, $12, $12, $13, $14)
          ON CONFLICT DO NOTHING
        `, [
          userId,
          memory.content,
          memory.summary,
          memory.category,
          embeddingStr,
          memory.confidence,
          sessionId,
          memory.emotional_arousal,
          memory.emotional_valence,
          memory.dominant_emotion,
          memory.llm_importance,
          memoryStrength,
          memory.granularity,
          memory.perplexity || 0,
        ])

        result.userMemoriesSaved++
      } catch (memError) {
        console.error('[Memory Save] Error saving user memory:', memError)
      }
    }

    // 3. Save Carl memories (relational memories)
    for (const memory of extracted.carlMemories) {
      try {
        const memoryStrength = calculateMemoryStrength({
          timesCited: 0,
          humeArousal: memory.emotional_arousal,
          textArousal: memory.emotional_arousal,
          llmImportance: memory.llm_importance,
          timesRetrievedUnused: 0,
        })

        const embeddingStr = `[${memory.embedding.join(',')}]`

        await execute(`
          INSERT INTO carl_relational_memories
          (user_id, content, summary, memory_type, embedding, source_session_id,
           emotional_arousal, emotional_valence, dominant_emotion, llm_importance,
           memory_strength, current_importance, granularity, effectiveness_score)
          VALUES ($1, $2, $3, $4, $5::vector, $6,
                  $7, $8, $9, $10, $11, $11, $12, $13)
          ON CONFLICT DO NOTHING
        `, [
          userId,
          memory.content,
          memory.summary,
          memory.type,
          embeddingStr,
          sessionId,
          memory.emotional_arousal,
          memory.emotional_valence,
          memory.dominant_emotion,
          memory.llm_importance,
          memoryStrength,
          memory.granularity,
          memory.effectivenessScore || 0.5,
        ])

        result.carlMemoriesSaved++
      } catch (memError) {
        console.error('[Memory Save] Error saving Carl memory:', memError)
      }
    }

    // 4. Save/update voice session if applicable
    if (sessionData) {
      try {
        // Extract topics from messages
        const topicsExplored = extractTopics(messages)

        // Check if session exists
        const existingSession = await queryOne(
          'SELECT id FROM voice_sessions WHERE id = $1',
          [sessionId]
        )

        if (existingSession) {
          await execute(`
            UPDATE voice_sessions SET
              topics_explored = $1,
              main_topic = $2,
              average_engagement = $3,
              breakthrough_count = $4,
              duration_seconds = $5,
              ended_at = NOW()
            WHERE id = $6
          `, [
            topicsExplored,
            sessionData.topic || topicsExplored[0] || 'General learning',
            sessionData.engagementScore || 0.5,
            sessionData.breakthroughCount || 0,
            sessionData.durationSeconds || 0,
            sessionId,
          ])
        } else {
          await execute(`
            INSERT INTO voice_sessions
            (id, user_id, topics_explored, main_topic, average_engagement, breakthrough_count, duration_seconds, started_at, ended_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - INTERVAL '1 second' * $7, NOW())
          `, [
            sessionId,
            userId,
            topicsExplored,
            sessionData.topic || topicsExplored[0] || 'General learning',
            sessionData.engagementScore || 0.5,
            sessionData.breakthroughCount || 0,
            sessionData.durationSeconds || 0,
          ])
        }

        result.sessionSaved = true
      } catch (sessionError) {
        console.error('[Memory Save] Error saving session:', sessionError)
      }
    }

    console.log(`[Memory Save] Complete: ${result.userMemoriesSaved} user memories, ${result.carlMemoriesSaved} Carl memories`)

    return result
  } catch (error) {
    console.error('[Memory Save] Error:', error)
    result.error = error instanceof Error ? error.message : 'Unknown error'
    return result
  }
}

/**
 * Extract topics from conversation messages
 */
function extractTopics(messages: ConversationMessage[]): string[] {
  const topics: string[] = []
  const topicIndicators = [
    'about', 'regarding', 'learn', 'understand', 'explore',
    'working on', 'thinking about', 'studying', 'focus on'
  ]

  for (const msg of messages) {
    if (msg.role !== 'user') continue
    const lower = msg.content.toLowerCase()

    for (const indicator of topicIndicators) {
      const idx = lower.indexOf(indicator)
      if (idx !== -1) {
        const afterIndicator = msg.content.slice(idx + indicator.length).trim()
        const topic = afterIndicator.split(/[.!?,]/)[0].trim()
        if (topic.length > 3 && topic.length < 50 && !topics.includes(topic)) {
          topics.push(topic)
        }
      }
    }
  }

  return topics.slice(0, 5) // Limit to 5 topics
}

/**
 * Quick save a single memory (for real-time use)
 */
export async function saveQuickMemory(
  userId: string,
  content: string,
  category: string,
  humeData?: {
    arousal: number
    valence: number
    dominantEmotion: string
    humeScores?: Record<string, number>
  }
): Promise<boolean> {
  try {
    const response = await fetch('/api/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        type: 'user',
        content,
        category,
        humeArousal: humeData?.arousal || 0.5,
        humeValence: humeData?.valence || 0,
        humeDominantEmotion: humeData?.dominantEmotion || 'neutral',
        humeScores: humeData?.humeScores || {},
        llmImportance: 0.5,
      }),
    })

    return response.ok
  } catch (error) {
    console.error('[Quick Memory] Error:', error)
    return false
  }
}
