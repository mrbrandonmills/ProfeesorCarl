/**
 * EXPERIENTIAL MEMORY - Teaching Strategies
 *
 * Based on 2026 research: "Experiential memory stores trajectories - past actions → outcomes"
 *
 * This module:
 * 1. Extracts teaching strategies from conversations
 * 2. Tracks what approaches worked for each student
 * 3. Retrieves relevant strategies for future sessions
 * 4. Updates success scores via reinforcement learning
 *
 * Example insight: "Last time Brandon struggled with derivatives, I used a
 * visual/graphical explanation and his Hume arousal spiked positive. He had
 * an 'aha!' moment. Use that approach again."
 */

import Anthropic from '@anthropic-ai/sdk'
import { execute, query } from '@/lib/db/postgres'

const anthropic = new Anthropic()

export interface TeachingStrategy {
  id?: string
  userId: string
  topic: string
  strategyUsed: string
  outcome: 'breakthrough' | 'partial_success' | 'no_progress' | 'confusion'
  humeArousalBefore?: number
  humeArousalAfter?: number
  sessionId?: string
  evidence?: string
  successScore?: number
}

interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  emotions?: Record<string, number>
  dominant_emotion?: string
  emotion_intensity?: number
}

interface HumeEmotionData {
  start_arousal?: number
  end_arousal?: number
  peak_moment?: string
  average_arousal?: number
  dominant_emotions?: string[]
}

/**
 * Extract teaching strategy from a conversation
 * Analyzes the exchange to identify what approach was used and its outcome
 */
export async function extractTeachingStrategy(
  messages: ConversationMessage[],
  humeEmotions: HumeEmotionData,
  userId: string,
  sessionId?: string
): Promise<TeachingStrategy | null> {
  // Need at least a few exchanges to analyze
  if (messages.length < 4) {
    return null
  }

  try {
    const prompt = `Analyze this tutoring exchange and identify the teaching strategy used and its outcome.

TRANSCRIPT:
${messages.slice(-10).map(m => `${m.role.toUpperCase()}: ${m.content.slice(0, 500)}`).join('\n\n')}

EMOTIONAL DATA:
- Arousal at start: ${humeEmotions.start_arousal ?? 'unknown'}
- Arousal at end: ${humeEmotions.end_arousal ?? 'unknown'}
- Peak emotional moment: ${humeEmotions.peak_moment ?? 'none detected'}
- Dominant emotions: ${humeEmotions.dominant_emotions?.join(', ') ?? 'unknown'}

Analyze:
1. What TOPIC was being taught? (Be specific: "derivatives", "limits", "integration")
2. What TEACHING APPROACH did the tutor use?
   Options: visual, analogy, socratic_questioning, worked_examples, step_by_step, real_world_application, scaffolding, direct_instruction, practice_problems
3. What was the OUTCOME?
   - breakthrough: Student had clear understanding moment, expressed excitement or relief
   - partial_success: Some progress but still uncertain
   - no_progress: Student still confused, no advancement
   - confusion: Student became MORE confused
4. What EVIDENCE indicates this outcome? Quote specific student responses.

If no clear teaching exchange occurred (just chat, greetings, etc.), respond with: { "no_strategy": true }

Output ONLY valid JSON:
{
  "topic": "specific topic name",
  "strategy": "approach name",
  "outcome": "breakthrough|partial_success|no_progress|confusion",
  "evidence": "brief quote or description of evidence"
}`

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const result = JSON.parse(jsonMatch[0])

    // Check if no strategy was extracted
    if (result.no_strategy) {
      console.log('[Experiential] No teaching strategy detected in this exchange')
      return null
    }

    // Calculate initial success score based on outcome
    const outcomeScores: Record<string, number> = {
      breakthrough: 0.9,
      partial_success: 0.6,
      no_progress: 0.3,
      confusion: 0.1
    }

    // Adjust by emotional change
    const emotionalBonus = (humeEmotions.end_arousal ?? 0.5) - (humeEmotions.start_arousal ?? 0.5)
    const successScore = Math.min(1, Math.max(0,
      outcomeScores[result.outcome] + (emotionalBonus * 0.2)
    ))

    const strategy: TeachingStrategy = {
      userId,
      topic: result.topic,
      strategyUsed: result.strategy,
      outcome: result.outcome,
      humeArousalBefore: humeEmotions.start_arousal,
      humeArousalAfter: humeEmotions.end_arousal,
      sessionId,
      evidence: result.evidence,
      successScore
    }

    console.log(`[Experiential] Extracted strategy: ${strategy.strategyUsed} for ${strategy.topic} → ${strategy.outcome} (score: ${successScore.toFixed(2)})`)

    return strategy
  } catch (error) {
    console.error('[Experiential] Error extracting strategy:', error)
    return null
  }
}

/**
 * Save a teaching strategy to the database
 */
export async function saveTeachingStrategy(strategy: TeachingStrategy): Promise<string | null> {
  try {
    // Check if we already have a similar strategy for this user/topic
    const existing = await query(`
      SELECT id, times_used, success_score
      FROM teaching_strategies
      WHERE user_id = $1
        AND topic = $2
        AND strategy_used = $3
      LIMIT 1
    `, [strategy.userId, strategy.topic, strategy.strategyUsed])

    if (existing && existing.length > 0) {
      // Update existing strategy with new data (running average)
      const row = existing[0]
      const newTimesUsed = row.times_used + 1
      const newSuccessScore = (row.success_score * row.times_used + (strategy.successScore ?? 0.5)) / newTimesUsed

      await execute(`
        UPDATE teaching_strategies
        SET times_used = $1,
            success_score = $2,
            last_used_at = NOW(),
            outcome = $3,
            evidence = $4,
            hume_arousal_before = $5,
            hume_arousal_after = $6
        WHERE id = $7
      `, [
        newTimesUsed,
        newSuccessScore,
        strategy.outcome,
        strategy.evidence,
        strategy.humeArousalBefore,
        strategy.humeArousalAfter,
        row.id
      ])

      console.log(`[Experiential] Updated existing strategy ${row.id}: score ${row.success_score.toFixed(2)} → ${newSuccessScore.toFixed(2)}`)
      return row.id
    } else {
      // Insert new strategy
      const result = await query(`
        INSERT INTO teaching_strategies
        (user_id, topic, strategy_used, outcome, hume_arousal_before, hume_arousal_after,
         session_id, evidence, success_score)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `, [
        strategy.userId,
        strategy.topic,
        strategy.strategyUsed,
        strategy.outcome,
        strategy.humeArousalBefore,
        strategy.humeArousalAfter,
        strategy.sessionId,
        strategy.evidence,
        strategy.successScore ?? 0.5
      ])

      const id = result[0]?.id
      console.log(`[Experiential] Saved new strategy ${id}: ${strategy.strategyUsed} for ${strategy.topic}`)
      return id
    }
  } catch (error) {
    console.error('[Experiential] Error saving strategy:', error)
    return null
  }
}

/**
 * Retrieve relevant teaching strategies for a user and topic
 * Returns strategies that worked well in the past
 */
export async function getRelevantStrategies(
  userId: string,
  topic?: string,
  limit: number = 3
): Promise<TeachingStrategy[]> {
  try {
    let strategies
    if (topic) {
      // Get strategies for specific topic, ordered by success
      strategies = await query(`
        SELECT id, topic, strategy_used, outcome, success_score, times_used, evidence
        FROM teaching_strategies
        WHERE user_id = $1
          AND (topic ILIKE $2 OR topic ILIKE $3)
          AND success_score > 0.4
        ORDER BY success_score DESC, times_used DESC
        LIMIT $4
      `, [userId, `%${topic}%`, topic, limit])
    } else {
      // Get best overall strategies for this student
      strategies = await query(`
        SELECT id, topic, strategy_used, outcome, success_score, times_used, evidence
        FROM teaching_strategies
        WHERE user_id = $1
          AND success_score > 0.5
        ORDER BY success_score DESC, times_used DESC
        LIMIT $2
      `, [userId, limit])
    }

    const results = strategies.map((s: any) => ({
      id: s.id,
      userId,
      topic: s.topic,
      strategyUsed: s.strategy_used,
      outcome: s.outcome,
      successScore: s.success_score,
      evidence: s.evidence
    }))

    console.log(`[Experiential] Retrieved ${results.length} strategies for user ${userId}${topic ? ` on ${topic}` : ''}`)
    return results
  } catch (error) {
    console.error('[Experiential] Error retrieving strategies:', error)
    return []
  }
}

/**
 * Format teaching strategies for prompt injection
 */
export function formatStrategiesForPrompt(strategies: TeachingStrategy[]): string {
  if (strategies.length === 0) return ''

  const parts = ['## Teaching Strategies That Work For This Student:']

  for (const s of strategies) {
    const successPct = Math.round((s.successScore ?? 0.5) * 100)
    parts.push(`- **${s.topic}**: Use ${s.strategyUsed} (${successPct}% success)`)
    if (s.evidence) {
      parts.push(`  Evidence: "${s.evidence.slice(0, 100)}..."`)
    }
  }

  return parts.join('\n')
}

/**
 * Update strategy success score based on session outcome
 * Called via reinforcement learning when a session ends
 */
export async function updateStrategyScore(
  strategyId: string,
  wasSuccessful: boolean,
  newArousalDelta?: number
): Promise<void> {
  try {
    const strategy = await query(
      'SELECT success_score, times_used FROM teaching_strategies WHERE id = $1',
      [strategyId]
    )

    if (!strategy || strategy.length === 0) return

    const current = strategy[0]
    const adjustment = wasSuccessful ? 0.1 : -0.05
    const arousalBonus = newArousalDelta ? newArousalDelta * 0.1 : 0

    const newScore = Math.min(1, Math.max(0,
      current.success_score + adjustment + arousalBonus
    ))

    await execute(`
      UPDATE teaching_strategies
      SET success_score = $1,
          times_used = times_used + 1,
          last_used_at = NOW()
      WHERE id = $2
    `, [newScore, strategyId])

    console.log(`[Experiential] Updated strategy ${strategyId}: ${current.success_score.toFixed(2)} → ${newScore.toFixed(2)}`)
  } catch (error) {
    console.error('[Experiential] Error updating score:', error)
  }
}
