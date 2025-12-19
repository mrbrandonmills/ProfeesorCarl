// ===========================================
// CONVERSATION CONTEXT BUILDER
// ===========================================
// Builds rich context for Carl at conversation start
// Returns Brandon facts, Carl memories, teaching approaches, shared references

import { NextRequest, NextResponse } from 'next/server'
import { query, vectorSearch } from '@/lib/db/postgres'
import { generateEmbedding } from '@/lib/ai/embeddings'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const topic = searchParams.get('topic') || ''
  const contextDepth = searchParams.get('depth') || 'standard' // minimal, standard, comprehensive

  try {
    console.log('[Memory Context] Building context, topic:', topic, 'depth:', contextDepth)

    // Determine limits based on depth
    const limits = {
      minimal: { facts: 3, carl: 2, approaches: 2, references: 1 },
      standard: { facts: 5, carl: 5, approaches: 3, references: 3 },
      comprehensive: { facts: 10, carl: 10, approaches: 5, references: 5 },
    }[contextDepth] || { facts: 5, carl: 5, approaches: 3, references: 3 }

    // If topic provided, use semantic search
    let topicEmbedding: number[] | null = null
    if (topic) {
      topicEmbedding = await generateEmbedding(topic)
    }

    // Get Brandon facts (relevant to topic if provided, otherwise recent)
    let brandonFacts
    if (topicEmbedding) {
      brandonFacts = await vectorSearch(
        'brandon_memories',
        topicEmbedding,
        {
          limit: limits.facts,
          where: 'is_current = true',
          selectFields: 'id, content, summary, category, confidence',
        }
      )
    } else {
      brandonFacts = await query(`
        SELECT id, content, summary, category, confidence
        FROM brandon_memories
        WHERE is_current = true
        ORDER BY reference_count DESC, confidence DESC
        LIMIT $1
      `, [limits.facts])
    }

    // Get Carl's relational memories (relevant to topic if provided)
    let carlMemories
    if (topicEmbedding) {
      carlMemories = await vectorSearch(
        'carl_relational_memories',
        topicEmbedding,
        {
          limit: limits.carl,
          selectFields: 'id, content, summary, memory_type, effectiveness_score',
        }
      )
    } else {
      carlMemories = await query(`
        SELECT id, content, summary, memory_type, effectiveness_score
        FROM carl_relational_memories
        ORDER BY occurred_at DESC
        LIMIT $1
      `, [limits.carl])
    }

    // Get successful teaching approaches
    const teachingApproaches = await query(`
      SELECT content, summary, effectiveness_score
      FROM carl_relational_memories
      WHERE memory_type = 'teaching_success'
        AND effectiveness_score > 0.5
      ORDER BY effectiveness_score DESC, times_used DESC
      LIMIT $1
    `, [limits.approaches])

    // Get inside jokes and shared references
    const sharedReferences = await query(`
      SELECT content, summary, memory_type
      FROM carl_relational_memories
      WHERE memory_type IN ('inside_joke', 'shared_reference')
      ORDER BY occurred_at DESC
      LIMIT $1
    `, [limits.references])

    // Get last session summary if available
    const lastSession = await query(`
      SELECT
        id,
        topics_explored,
        main_topic,
        average_engagement,
        breakthrough_count,
        duration_seconds,
        started_at
      FROM voice_sessions
      ORDER BY started_at DESC
      LIMIT 1
    `)

    // Get session count for relationship context
    const sessionStats = await query(`
      SELECT
        COUNT(*) as total_sessions,
        SUM(duration_seconds) as total_time,
        SUM(breakthrough_count) as total_breakthroughs
      FROM voice_sessions
    `)

    // Format context for Carl
    const context = {
      // Brandon's relevant facts
      brandonFacts: brandonFacts.map((f: any) => ({
        fact: f.summary || f.content,
        category: f.category,
        confidence: f.confidence,
        similarity: f.similarity,
      })),

      // Carl's relevant memories about their relationship
      carlMemories: carlMemories.map((m: any) => ({
        memory: m.summary || m.content,
        type: m.memory_type,
        effectiveness: m.effectiveness_score,
        similarity: m.similarity,
      })),

      // Teaching approaches that work
      teachingApproaches: teachingApproaches.map((a: any) => ({
        approach: a.summary || a.content,
        effectiveness: a.effectiveness_score,
      })),

      // Shared references and inside jokes (for personality)
      sharedReferences: sharedReferences.map((r: any) => ({
        reference: r.summary || r.content,
        type: r.memory_type,
      })),

      // Last session context
      lastSession: lastSession[0] ? {
        topics: lastSession[0].topics_explored,
        mainTopic: lastSession[0].main_topic,
        engagement: lastSession[0].average_engagement,
        breakthroughs: lastSession[0].breakthrough_count,
        duration: lastSession[0].duration_seconds,
        when: lastSession[0].started_at,
      } : null,

      // Relationship stats
      relationshipStats: sessionStats[0] ? {
        totalSessions: parseInt(sessionStats[0].total_sessions) || 0,
        totalTimeSeconds: parseInt(sessionStats[0].total_time) || 0,
        totalBreakthroughs: parseInt(sessionStats[0].total_breakthroughs) || 0,
      } : { totalSessions: 0, totalTimeSeconds: 0, totalBreakthroughs: 0 },

      // Metadata
      generatedAt: new Date().toISOString(),
      topic: topic || null,
      contextDepth,
    }

    console.log('[Memory Context] Built context with', brandonFacts.length, 'facts,', carlMemories.length, 'Carl memories')

    return NextResponse.json({
      success: true,
      context,
    })

  } catch (error) {
    console.error('[Memory Context] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to build context' },
      { status: 500 }
    )
  }
}
