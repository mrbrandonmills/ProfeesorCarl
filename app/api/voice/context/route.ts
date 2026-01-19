// ===========================================
// VOICE CONTEXT BUILDER FOR HUME EVI
// ===========================================
// Returns formatted memory context as a string for Hume session_settings
// This enables Professor Carl to know Brandon's facts during voice sessions

import { NextRequest, NextResponse } from 'next/server'
import { query, vectorSearch } from '@/lib/db/postgres'
import { generateEmbedding } from '@/lib/ai/embeddings'
import { fetchAnchorMemories } from '@/lib/memory/unified'

/**
 * Format time duration in a human-readable way
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`
  const hours = Math.floor(seconds / 3600)
  const mins = Math.round((seconds % 3600) / 60)
  return mins > 0 ? `${hours} hours and ${mins} minutes` : `${hours} hours`
}

/**
 * Format days ago in a natural way
 */
function formatDaysAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return `${Math.floor(diffDays / 30)} months ago`
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const rawUserId = searchParams.get('user_id') || 'brandon'
  const topic = searchParams.get('topic') || ''
  const isDemo = searchParams.get('demo') === 'true'

  // Validate userId format to prevent SQL injection (alphanumeric, hyphens, underscores only)
  if (!/^[a-zA-Z0-9_-]+$/.test(rawUserId)) {
    return NextResponse.json(
      { error: 'Invalid user_id format' },
      { status: 400 }
    )
  }
  const userId = rawUserId

  try {
    console.log('[Voice Context] Building context for user:', userId, 'demo:', isDemo)

    // If topic provided, use semantic search
    let topicEmbedding: number[] | null = null
    if (topic) {
      topicEmbedding = await generateEmbedding(topic)
    }

    // Get user facts - more for voice since we need personality context
    let userFacts
    if (topicEmbedding) {
      const embeddingStr = `[${topicEmbedding.join(',')}]`
      userFacts = await query(`
        SELECT * FROM retrieve_memories_hybrid($1, $2::vector, $3, NULL)
      `, [userId, embeddingStr, 8])
    } else {
      userFacts = await query(`
        SELECT * FROM retrieve_memories_hybrid($1, NULL, $2, NULL)
      `, [userId, 8])
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

    // Get teaching approaches
    const teachingApproaches = await query(`
      SELECT content, summary, effectiveness_score
      FROM carl_relational_memories
      WHERE user_id = $1
        AND memory_type = 'teaching_success'
        AND effectiveness_score > 0.5
      ORDER BY effectiveness_score DESC
      LIMIT 3
    `, [userId])

    // Get last session
    const lastSession = await query(`
      SELECT
        topics_explored,
        main_topic,
        average_engagement,
        breakthrough_count,
        duration_seconds,
        started_at
      FROM voice_sessions
      WHERE user_id = $1
      ORDER BY started_at DESC
      LIMIT 1
    `, [userId])

    // Get relationship stats
    const sessionStats = await query(`
      SELECT
        COUNT(*) as total_sessions,
        SUM(duration_seconds) as total_time,
        SUM(breakthrough_count) as total_breakthroughs
      FROM voice_sessions
      WHERE user_id = $1
    `, [userId])

    // Fetch ANCHOR memories (financial coaching context)
    const anchorContext = await fetchAnchorMemories(userId, topic, 5)

    // Build the formatted context string for Hume
    const parts: string[] = []

    // Relationship history section
    const stats = sessionStats[0] || { total_sessions: 0, total_time: 0, total_breakthroughs: 0 }
    const totalSessions = parseInt(stats.total_sessions) || 0
    const totalTime = parseInt(stats.total_time) || 0
    const totalBreakthroughs = parseInt(stats.total_breakthroughs) || 0

    if (totalSessions > 0) {
      parts.push(`═══ YOUR HISTORY WITH ${userId.toUpperCase()} ═══`)
      parts.push(`Sessions together: ${totalSessions}`)
      parts.push(`Total time: ${formatDuration(totalTime)}`)
      if (totalBreakthroughs > 0) {
        parts.push(`Breakthrough moments shared: ${totalBreakthroughs}`)
      }

      if (lastSession[0]) {
        const lastDate = new Date(lastSession[0].started_at)
        const lastTopic = lastSession[0].main_topic || 'general exploration'
        parts.push(`Last session: ${lastTopic} (${formatDaysAgo(lastDate)})`)
      }
      parts.push('')
    }

    // What Carl knows about the user
    if (userFacts.length > 0) {
      parts.push(`═══ WHAT YOU KNOW ABOUT ${userId.toUpperCase()} ═══`)
      userFacts.forEach((f: any) => {
        const fact = f.summary || f.content
        const emotionTag = f.dominant_emotion && f.dominant_emotion !== 'neutral'
          ? ` [${f.dominant_emotion}]`
          : ''
        parts.push(`• ${fact}${emotionTag}`)
      })
      parts.push('')
    }

    // Teaching approaches that work
    if (teachingApproaches.length > 0) {
      parts.push(`═══ TEACHING APPROACHES THAT WORK ═══`)
      teachingApproaches.forEach((a: any) => {
        parts.push(`• ${a.summary || a.content}`)
      })
      parts.push('')
    }

    // Carl's relationship notes
    if (carlMemories.length > 0) {
      parts.push(`═══ YOUR NOTES ABOUT YOUR RELATIONSHIP ═══`)
      carlMemories.forEach((m: any) => {
        parts.push(`• ${m.summary || m.content}`)
      })
      parts.push('')
    }

    // ANCHOR financial coaching context
    if (anchorContext.success && (anchorContext.userMemories.length > 0 || anchorContext.anchorMemories.length > 0)) {
      parts.push(`═══ FROM ANCHOR (FINANCIAL COACHING) ═══`)

      if (anchorContext.userMemories.length > 0) {
        anchorContext.userMemories.forEach((m) => {
          const emotionTag = m.dominantEmotion !== 'neutral' ? ` [${m.dominantEmotion}]` : ''
          parts.push(`• ${m.summary || m.content}${emotionTag}`)
        })
      }

      if (anchorContext.anchorMemories.length > 0) {
        anchorContext.anchorMemories.forEach((m) => {
          const typeLabel = m.memoryType === 'breakthrough' ? '💡' :
                           m.memoryType === 'concern' ? '⚠️' :
                           m.memoryType === 'teaching_success' ? '✓' : '•'
          parts.push(`${typeLabel} ${m.summary || m.content}`)
        })
      }
      parts.push('')
    }

    // Demo mode section
    if (isDemo) {
      parts.push(`═══ DEMO MODE ACTIVE ═══`)
      parts.push(`You are being demonstrated LIVE to an audience.`)
      parts.push(`• Show off your memory of ${userId} naturally`)
      parts.push(`• Reference specific facts you know about them`)
      parts.push(`• Be brilliant, funny, and genuinely engaging`)
      parts.push(`• When asked "tell them about me/us" - describe your relationship`)
      parts.push('')
    }

    const formattedContext = parts.join('\n')

    // Also return structured data for mobile app to use
    return NextResponse.json({
      success: true,
      // The formatted string for Hume session injection
      formattedContext,
      // Structured data if needed
      stats: {
        totalSessions,
        totalTime: formatDuration(totalTime),
        totalBreakthroughs,
        lastSessionTopic: lastSession[0]?.main_topic || null,
        lastSessionDate: lastSession[0]?.started_at || null,
      },
      // Memory IDs for RL feedback
      retrievedMemoryIds: [
        ...userFacts.map((f: any) => f.id),
        ...carlMemories.map((m: any) => m.id),
        ...anchorContext.userMemories.map((m) => `anchor-user-${m.id}`),
        ...anchorContext.anchorMemories.map((m) => `anchor-rel-${m.id}`),
      ].filter(Boolean),
    })

  } catch (error) {
    console.error('[Voice Context] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to build voice context' },
      { status: 500 }
    )
  }
}
