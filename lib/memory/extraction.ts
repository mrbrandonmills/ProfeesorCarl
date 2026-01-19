// ===========================================
// MEMORY EXTRACTION PIPELINE
// ===========================================
// Uses Claude to extract Brandon facts and Carl relational memories
// from conversation transcripts

import Anthropic from '@anthropic-ai/sdk'
import { generateEmbedding } from '@/lib/ai/embeddings'

const anthropic = new Anthropic()

interface TranscriptEntry {
  role: 'user' | 'assistant'
  content: string
  emotions?: Record<string, number>
  dominant_emotion?: string
  emotion_intensity?: number
}

interface ExtractedBrandonMemory {
  content: string
  summary: string
  category: string
  confidence: number
  // Cognitive memory fields (LUFY emotional salience)
  emotional_arousal: number      // 0.0-1.0: How emotionally intense
  emotional_valence: number      // -1.0 to 1.0: Negative to positive
  dominant_emotion: string       // joy, fear, determination, curiosity, etc.
  llm_importance: number         // 0.0-1.0: How important for understanding user
  granularity: 'utterance' | 'turn' | 'session'  // Detail level
  perplexity: number            // 0.0-1.0: How surprising/unexpected
}

interface ExtractedCarlMemory {
  content: string
  summary: string
  type: string
  emotionalContext?: Record<string, any>
  effectivenessScore?: number
  // Cognitive memory fields (LUFY emotional salience)
  emotional_arousal: number      // 0.0-1.0: How emotionally intense
  emotional_valence: number      // -1.0 to 1.0: Negative to positive
  dominant_emotion: string       // joy, fear, determination, curiosity, etc.
  llm_importance: number         // 0.0-1.0: How important for understanding user
  granularity: 'utterance' | 'turn' | 'session'  // Detail level
}

interface ExtractionResult {
  brandonMemories: (ExtractedBrandonMemory & { embedding: number[] })[]
  carlMemories: (ExtractedCarlMemory & { embedding: number[] })[]
}

const EXTRACTION_PROMPT = `You are analyzing a voice conversation between Professor Carl (a British AI tutor) and the user.

Your task is to extract two types of memories with COGNITIVE SCORING for human-like recall.

## BRANDON MEMORIES (Facts about the user's life)
Extract any facts, preferences, goals, relationships, experiences, or beliefs that the user explicitly shared or clearly implied.

Valid categories:
- personal_fact: Basic info (age, location, etc.)
- preference: Things user likes/dislikes, learning style
- goal: What user is working toward
- relationship: Family, friends, pets, colleagues
- experience: Past experiences, stories shared
- skill: Things user knows or is learning
- belief: Values, worldview, perspectives
- struggle: Challenges, obstacles user faces
- achievement: Accomplishments, wins
- routine: Habits, daily patterns

## CARL RELATIONAL MEMORIES (Carl's perspective on their relationship)
Extract observations Carl would make about:
- Teaching approaches that worked well or poorly
- Breakthrough/aha moments
- Inside jokes or shared references that developed
- Patterns in how user engages
- Emotional milestones in their relationship

Valid types:
- teaching_success: Approach that worked well (effectiveness 0.5-1.0)
- teaching_failure: Approach that didn't land (effectiveness -1.0 to 0)
- breakthrough_moment: Aha! moment (effectiveness 0.8-1.0)
- inside_joke: Shared humor developed
- shared_reference: Things they both understand
- emotional_milestone: Important emotional moments
- topic_affinity: Topics user loves/hates
- interaction_pattern: How user prefers to engage
- growth_observation: How user has developed
- relationship_insight: Meta-observations about their bond

## COGNITIVE SCORING (Required for ALL memories)

For EACH memory, you MUST provide these cognitive scores:

1. **emotional_arousal** (0.0-1.0): How emotionally intense was this moment?
   - 0.9-1.0: Life-defining (cancer survivor, death of loved one, major achievement)
   - 0.7-0.8: Significant (career change, relationship milestone)
   - 0.5-0.6: Moderate (preferences, regular goals)
   - 0.2-0.4: Low (routine facts, casual mentions)

2. **emotional_valence** (-1.0 to 1.0): Emotional direction
   - Positive (0.5 to 1.0): Joy, excitement, pride, love
   - Neutral (-0.2 to 0.2): Factual, informational
   - Negative (-1.0 to -0.5): Pain, fear, frustration, loss

3. **dominant_emotion**: The primary emotion (one word)
   - Options: joy, excitement, pride, love, warmth, curiosity, determination,
     anxiety, fear, frustration, sadness, anger, neutral

4. **llm_importance** (0.0-1.0): How critical for understanding this person?
   - 0.9-1.0: Core identity (values, life mission, trauma/recovery)
   - 0.7-0.8: Important context (career, relationships, major preferences)
   - 0.5-0.6: Useful context (hobbies, minor preferences)
   - 0.2-0.4: Nice to know (trivia, casual facts)

5. **granularity**: Level of abstraction
   - "utterance": Single specific fact (e.g., "Has a dog named Achilles")
   - "turn": Theme from conversation segment (e.g., "Learning about consciousness")
   - "session": Overarching insight (e.g., "Rebuilding life after cancer")

6. **perplexity** (0.0-1.0, Brandon memories only): How surprising/unexpected?
   - 0.8-1.0: Very unexpected given what we know
   - 0.5-0.7: Somewhat surprising
   - 0.1-0.4: Expected/predictable

## OUTPUT FORMAT

For each memory provide:
- content: The full memory/fact (1-3 sentences)
- summary: One-line summary (under 100 chars)
- category/type: From the lists above
- confidence: 0.0-1.0 how certain (for user memories)
- effectivenessScore: -1.0 to 1.0 (for Carl teaching memories)
- emotionalContext: What emotions were present (for Carl)
- emotional_arousal: Required cognitive score
- emotional_valence: Required cognitive score
- dominant_emotion: Required cognitive score
- llm_importance: Required cognitive score
- granularity: Required cognitive score
- perplexity: Required for user memories

IMPORTANT:
- Only extract memories that are MEANINGFUL for future conversations
- Don't extract trivial small talk
- Be specific and include context
- High emotional_arousal memories should ALWAYS be surfaced in future
- For Carl memories, focus on what would help future interactions

Respond in JSON format only:
{
  "brandonMemories": [...],
  "carlMemories": [...]
}

If no meaningful memories to extract, respond with empty arrays.`

export async function extractMemoriesFromConversation(
  transcript: TranscriptEntry[]
): Promise<ExtractionResult> {
  if (!transcript || transcript.length === 0) {
    return { brandonMemories: [], carlMemories: [] }
  }

  // Format conversation for extraction
  const conversationText = transcript
    .map(t => {
      const emotionTag = t.dominant_emotion ? ` [${t.dominant_emotion}]` : ''
      const speaker = t.role === 'user' ? 'BRANDON' : 'CARL'
      return `${speaker}${emotionTag}: ${t.content}`
    })
    .join('\n\n')

  console.log('[Extraction] Processing conversation with', transcript.length, 'messages')

  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `${EXTRACTION_PROMPT}\n\nCONVERSATION:\n${conversationText}`
      }]
    })

    // Parse response
    const content = response.content[0]
    if (content.type !== 'text') {
      console.warn('[Extraction] Unexpected response type:', content.type)
      return { brandonMemories: [], carlMemories: [] }
    }

    // Extract JSON from response (may have markdown code blocks)
    let extracted: {
      brandonMemories: ExtractedBrandonMemory[]
      carlMemories: ExtractedCarlMemory[]
    }

    try {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        console.warn('[Extraction] No JSON found in response')
        return { brandonMemories: [], carlMemories: [] }
      }
      extracted = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error('[Extraction] Failed to parse JSON:', content.text.substring(0, 500))
      return { brandonMemories: [], carlMemories: [] }
    }

    // Validate and filter
    const validBrandonCategories = [
      'personal_fact', 'preference', 'goal', 'relationship', 'experience',
      'skill', 'belief', 'struggle', 'achievement', 'routine'
    ]
    const validCarlTypes = [
      'teaching_success', 'teaching_failure', 'breakthrough_moment', 'inside_joke',
      'shared_reference', 'emotional_milestone', 'topic_affinity', 'interaction_pattern',
      'growth_observation', 'relationship_insight'
    ]

    const brandonMemories = (extracted.brandonMemories || [])
      .filter(m => m.content && validBrandonCategories.includes(m.category))
      .map(m => ({
        ...m,
        confidence: Math.max(0, Math.min(1, m.confidence || 0.8)),
        // Cognitive memory fields with validation and defaults
        emotional_arousal: Math.max(0, Math.min(1, m.emotional_arousal || 0.5)),
        emotional_valence: Math.max(-1, Math.min(1, m.emotional_valence || 0)),
        dominant_emotion: m.dominant_emotion || 'neutral',
        llm_importance: Math.max(0, Math.min(1, m.llm_importance || 0.5)),
        granularity: ['utterance', 'turn', 'session'].includes(m.granularity)
          ? m.granularity
          : 'utterance',
        perplexity: Math.max(0, Math.min(1, m.perplexity || 0)),
      }))

    const carlMemories = (extracted.carlMemories || [])
      .filter(m => m.content && validCarlTypes.includes(m.type))
      .map(m => ({
        ...m,
        effectivenessScore: m.effectivenessScore !== undefined
          ? Math.max(-1, Math.min(1, m.effectivenessScore))
          : undefined,
        // Cognitive memory fields with validation and defaults
        emotional_arousal: Math.max(0, Math.min(1, m.emotional_arousal || 0.5)),
        emotional_valence: Math.max(-1, Math.min(1, m.emotional_valence || 0)),
        dominant_emotion: m.dominant_emotion || 'neutral',
        llm_importance: Math.max(0, Math.min(1, m.llm_importance || 0.5)),
        granularity: ['utterance', 'turn', 'session'].includes(m.granularity)
          ? m.granularity
          : 'turn',
      }))

    console.log('[Extraction] Found', brandonMemories.length, 'Brandon memories,', carlMemories.length, 'Carl memories')

    // Generate embeddings for all memories
    const brandonWithEmbeddings = await Promise.all(
      brandonMemories.map(async (memory) => ({
        ...memory,
        embedding: await generateEmbedding(memory.content),
      }))
    )

    const carlWithEmbeddings = await Promise.all(
      carlMemories.map(async (memory) => ({
        ...memory,
        embedding: await generateEmbedding(memory.content),
      }))
    )

    return {
      brandonMemories: brandonWithEmbeddings,
      carlMemories: carlWithEmbeddings,
    }

  } catch (error) {
    console.error('[Extraction] Error:', error)
    throw error
  }
}
