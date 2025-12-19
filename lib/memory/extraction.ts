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
}

interface ExtractedCarlMemory {
  content: string
  summary: string
  type: string
  emotionalContext?: Record<string, any>
  effectivenessScore?: number
}

interface ExtractionResult {
  brandonMemories: (ExtractedBrandonMemory & { embedding: number[] })[]
  carlMemories: (ExtractedCarlMemory & { embedding: number[] })[]
}

const EXTRACTION_PROMPT = `You are analyzing a voice conversation between Professor Carl (a British AI tutor) and Brandon Mills (the user).

Your task is to extract two types of memories that should be saved for future conversations:

## BRANDON MEMORIES (Facts about Brandon's life)
Extract any facts, preferences, goals, relationships, experiences, or beliefs that Brandon explicitly shared or clearly implied.

Valid categories:
- personal_fact: Basic info about Brandon (age, location, etc.)
- preference: Things Brandon likes/dislikes, learning style
- goal: What Brandon is working toward
- relationship: Family, friends, pets, colleagues
- experience: Past experiences, stories shared
- skill: Things Brandon knows or is learning
- belief: Values, worldview, perspectives
- struggle: Challenges, obstacles Brandon faces
- achievement: Accomplishments, wins
- routine: Habits, daily patterns

## CARL RELATIONAL MEMORIES (Carl's perspective on their relationship)
Extract observations Carl would make about:
- Teaching approaches that worked well or poorly
- Breakthrough/aha moments
- Inside jokes or shared references that developed
- Patterns in how Brandon engages
- Emotional milestones in their relationship

Valid types:
- teaching_success: Approach that worked well (include effectiveness 0.5-1.0)
- teaching_failure: Approach that didn't land (include effectiveness -1.0 to 0)
- breakthrough_moment: Aha! moment (effectiveness 0.8-1.0)
- inside_joke: Shared humor developed
- shared_reference: Things they both understand
- emotional_milestone: Important emotional moments
- topic_affinity: Topics Brandon loves/hates
- interaction_pattern: How Brandon prefers to engage
- growth_observation: How Brandon has developed
- relationship_insight: Meta-observations about their bond

For each memory provide:
- content: The full memory/fact (1-3 sentences)
- summary: One-line summary (under 100 chars)
- category/type: From the lists above
- confidence: 0.0-1.0 how certain (for Brandon)
- effectivenessScore: -1.0 to 1.0 (for Carl teaching memories)
- emotionalContext: What emotions were present (for Carl)

IMPORTANT:
- Only extract memories that are MEANINGFUL for future conversations
- Don't extract trivial small talk
- Be specific and include context
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
      model: 'claude-sonnet-4-20250514',
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
      }))

    const carlMemories = (extracted.carlMemories || [])
      .filter(m => m.content && validCarlTypes.includes(m.type))
      .map(m => ({
        ...m,
        effectivenessScore: m.effectivenessScore !== undefined
          ? Math.max(-1, Math.min(1, m.effectivenessScore))
          : undefined,
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
