// ===========================================
// HUME EMOTION PROCESSING FOR MEMORY RANKING
// ===========================================
// Converts Hume prosody scores into memory-relevant metrics
// Used to weight memories by real vocal emotion, not just text analysis

// Hume emotion categories mapped to memory priority
// High arousal = important life moments worth remembering
const HIGH_AROUSAL_EMOTIONS = [
  'Excitement',
  'Determination',
  'Anger',
  'Fear',
  'Distress',
  'Pain',
  'Awe',
  'Ecstasy',
  'Triumph',
] as const

const MEDIUM_AROUSAL_EMOTIONS = [
  'Interest',
  'Concentration',
  'Curiosity',
  'Anxiety',
  'Surprise',
  'Contemplation',
  'Realization',
] as const

const LOW_AROUSAL_EMOTIONS = [
  'Calmness',
  'Boredom',
  'Tiredness',
  'Confusion',
  'Doubt',
] as const

// Valence mapping for emotional direction
const POSITIVE_EMOTIONS = [
  'Joy',
  'Excitement',
  'Interest',
  'Pride',
  'Love',
  'Determination',
  'Awe',
  'Contentment',
  'Satisfaction',
  'Relief',
  'Triumph',
  'Admiration',
] as const

const NEGATIVE_EMOTIONS = [
  'Sadness',
  'Fear',
  'Anger',
  'Distress',
  'Pain',
  'Anxiety',
  'Frustration',
  'Disappointment',
  'Guilt',
  'Shame',
  'Contempt',
  'Disgust',
] as const

export interface HumeEmotionScores {
  [emotion: string]: number  // 0.0 to 1.0
}

export interface ProcessedEmotions {
  // Core metrics for memory ranking
  arousal: number           // 0.0-1.0: How emotionally intense (voice energy)
  valence: number           // -1.0 to 1.0: Negative to positive
  dominantEmotion: string   // The strongest emotion detected
  dominantScore: number     // Score of dominant emotion

  // Memory priority flags
  isHighPriority: boolean   // Should this memory always surface?
  priorityReason: string    // Why it's high priority (for logging)

  // Raw data for analysis
  topEmotions: { emotion: string; score: number }[]
}

/**
 * Process Hume prosody scores into memory-relevant metrics
 * @param scores - Raw Hume emotion scores (emotion name -> 0-1 score)
 * @returns Processed emotions for memory ranking
 */
export function processHumeEmotions(scores: HumeEmotionScores): ProcessedEmotions {
  if (!scores || Object.keys(scores).length === 0) {
    return {
      arousal: 0.5,
      valence: 0,
      dominantEmotion: 'neutral',
      dominantScore: 0,
      isHighPriority: false,
      priorityReason: 'no_emotion_data',
      topEmotions: [],
    }
  }

  // Sort emotions by score
  const sortedEmotions = Object.entries(scores)
    .map(([emotion, score]) => ({ emotion, score }))
    .sort((a, b) => b.score - a.score)

  const topEmotions = sortedEmotions.slice(0, 5)
  const dominantEmotion = sortedEmotions[0]?.emotion || 'neutral'
  const dominantScore = sortedEmotions[0]?.score || 0

  // Calculate arousal from emotion categories
  let arousal = 0.5  // baseline
  let arousalCount = 0

  for (const { emotion, score } of sortedEmotions) {
    if (HIGH_AROUSAL_EMOTIONS.includes(emotion as any)) {
      arousal += score * 1.0  // Full weight for high arousal
      arousalCount++
    } else if (MEDIUM_AROUSAL_EMOTIONS.includes(emotion as any)) {
      arousal += score * 0.6  // Partial weight
      arousalCount++
    } else if (LOW_AROUSAL_EMOTIONS.includes(emotion as any)) {
      arousal -= score * 0.3  // Reduces arousal
      arousalCount++
    }
  }

  // Normalize arousal to 0-1 range
  if (arousalCount > 0) {
    arousal = Math.max(0, Math.min(1, arousal / Math.max(arousalCount, 1)))
  }

  // Calculate valence from positive/negative emotions
  let positiveSum = 0
  let negativeSum = 0

  for (const { emotion, score } of sortedEmotions) {
    if (POSITIVE_EMOTIONS.includes(emotion as any)) {
      positiveSum += score
    } else if (NEGATIVE_EMOTIONS.includes(emotion as any)) {
      negativeSum += score
    }
  }

  // Normalize valence to -1 to +1
  const totalEmotional = positiveSum + negativeSum
  let valence = 0
  if (totalEmotional > 0) {
    valence = (positiveSum - negativeSum) / totalEmotional
  }

  // Determine if this is a high-priority memory moment
  let isHighPriority = false
  let priorityReason = 'normal'

  // High priority triggers:
  // 1. Very high arousal (emotional intensity > 0.7)
  if (arousal > 0.7) {
    isHighPriority = true
    priorityReason = `high_arousal_${arousal.toFixed(2)}`
  }

  // 2. Strong negative emotion (painful, frustrating) - these are important to remember
  if (negativeSum > 0.6 && dominantScore > 0.4) {
    isHighPriority = true
    priorityReason = `strong_negative_${dominantEmotion}`
  }

  // 3. Breakthrough emotions (determination + excitement)
  const determination = scores['Determination'] || 0
  const excitement = scores['Excitement'] || 0
  if (determination > 0.3 && excitement > 0.3) {
    isHighPriority = true
    priorityReason = 'breakthrough_moment'
  }

  // 4. Pain or distress - always remember struggles
  if ((scores['Pain'] || 0) > 0.4 || (scores['Distress'] || 0) > 0.5) {
    isHighPriority = true
    priorityReason = 'emotional_struggle'
  }

  return {
    arousal,
    valence,
    dominantEmotion,
    dominantScore,
    isHighPriority,
    priorityReason,
    topEmotions,
  }
}

/**
 * Calculate average emotions from a history of emotion samples
 * Used at end of conversation to get overall emotional tone
 */
export function averageEmotionHistory(history: HumeEmotionScores[]): ProcessedEmotions {
  if (!history || history.length === 0) {
    return processHumeEmotions({})
  }

  // Combine all emotion scores
  const combined: HumeEmotionScores = {}

  for (const sample of history) {
    for (const [emotion, score] of Object.entries(sample)) {
      if (!combined[emotion]) {
        combined[emotion] = 0
      }
      combined[emotion] += score
    }
  }

  // Average them
  for (const emotion of Object.keys(combined)) {
    combined[emotion] /= history.length
  }

  return processHumeEmotions(combined)
}

/**
 * Map dominant emotion to a memory-friendly category
 * Used for the dominant_emotion field in database
 */
export function mapToMemoryEmotion(humeEmotion: string): string {
  const mapping: Record<string, string> = {
    // Positive high-energy
    'Excitement': 'excitement',
    'Joy': 'joy',
    'Triumph': 'pride',
    'Ecstasy': 'joy',

    // Positive calm
    'Contentment': 'warmth',
    'Love': 'love',
    'Admiration': 'warmth',
    'Pride': 'pride',

    // Engaged/Curious
    'Interest': 'curiosity',
    'Curiosity': 'curiosity',
    'Concentration': 'focus',
    'Contemplation': 'curiosity',
    'Realization': 'insight',
    'Awe': 'awe',

    // Determined/Driven
    'Determination': 'determination',

    // Negative but important
    'Anxiety': 'anxiety',
    'Fear': 'fear',
    'Sadness': 'sadness',
    'Anger': 'frustration',
    'Frustration': 'frustration',
    'Pain': 'pain',
    'Distress': 'distress',
    'Disappointment': 'disappointment',

    // Neutral
    'Calmness': 'neutral',
    'Boredom': 'neutral',
    'Confusion': 'confusion',
  }

  return mapping[humeEmotion] || 'neutral'
}

// ===========================================
// MEMORY STRENGTH FORMULA
// ===========================================
// Combines repetition, Hume prosody, and text analysis

export interface MemoryStrengthInputs {
  timesCited: number           // How often memory was referenced (MOST IMPORTANT)
  humeArousal: number          // 0-1 from voice prosody
  textArousal: number          // 0-1 from Claude text analysis
  llmImportance: number        // 0-1 topic importance
  timesRetrievedUnused: number // Penalty for unused retrievals
}

/**
 * Calculate memory strength using weighted formula
 *
 * Formula:
 * S = W_rep × log(1 + times_cited) +    // Repetition (most important)
 *     W_hume × hume_arousal +            // Real voice emotion
 *     W_text × text_arousal +            // Text analysis backup
 *     W_imp × llm_importance +           // Topic importance
 *     - W_decay × times_unused           // Penalty
 *
 * Weights tuned for:
 * - Repetition > Hume emotion > Text emotion > Importance
 * - Memories mentioned 3+ times get significant boost
 * - High vocal emotion (0.8+) nearly equals one repetition
 */
export function calculateMemoryStrength(inputs: MemoryStrengthInputs): number {
  const {
    timesCited,
    humeArousal,
    textArousal,
    llmImportance,
    timesRetrievedUnused,
  } = inputs

  // Weights - tuned for importance hierarchy
  const W_REP = 3.0      // Repetition is king - log scale for diminishing returns
  const W_HUME = 2.5     // Real voice emotion - very important
  const W_TEXT = 1.0     // Text analysis - backup/validation
  const W_IMP = 0.5      // Topic importance - baseline
  const W_DECAY = 0.015  // Small penalty for unused retrievals

  // Calculate strength
  const repetitionScore = W_REP * Math.log(1 + timesCited)
  const humeScore = W_HUME * humeArousal
  const textScore = W_TEXT * textArousal
  const importanceScore = W_IMP * llmImportance
  const decayPenalty = W_DECAY * timesRetrievedUnused

  const strength = repetitionScore + humeScore + textScore + importanceScore - decayPenalty

  // Minimum strength of 0.5 (never fully forget)
  return Math.max(0.5, strength)
}

/**
 * Combine Hume prosody with text analysis for final arousal score
 * Hume is weighted higher because it's real voice data
 */
export function combineArousalScores(
  humeArousal: number,
  textArousal: number
): number {
  // Weight: 70% Hume (real voice), 30% text (Claude analysis)
  const combined = (humeArousal * 0.7) + (textArousal * 0.3)
  return Math.max(0, Math.min(1, combined))
}
