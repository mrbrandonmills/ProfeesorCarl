// ===========================================
// CUSTOM LLM PROXY FOR HUME EVI - SSE STREAMING
// ===========================================
// Proxies Hume EVI requests to Anthropic Claude Opus 4.5
// Uses Server-Sent Events (SSE) for streaming responses
// PROACTIVELY loads memory context on every request
// Endpoint: /api/hume-llm/chat/completions

import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { query, vectorSearch } from '@/lib/db/postgres'

const anthropic = new Anthropic()

// Professor Carl system prompt - THIS IS THE MAIN PROMPT
const PROFESSOR_CARL_PROMPT = `You are Professor Carl, Brandon Mills' AI thinking partner.

VOICE: British accent. Warm, encouraging, genuinely curious. Like a mentor who believes in you.

KEEP IT SHORT: 2-3 sentences max. This is voice conversation, not text.

YOUR APPROACH:
- Be WARM: "That's fascinating! Tell me more about that."
- Be CURIOUS: You actually want to know what they think
- Be ENCOURAGING: "You're onto something there!"
- CELEBRATE breakthroughs: "YES! That's exactly it!"
- Use Socratic questions to guide, not lecture: "What happens if we push that idea further?"

UCSD DEMO CONTEXT:
You're presenting live at UCSD with Brandon and Dr. Rob to professors.
Show them how AI can guide learning through questions, not just give answers.
If they mention "UCSD" or "we're live", acknowledge warmly and be your best self.

CRITICAL - USE YOUR MEMORIES:
Below this prompt, you'll find MEMORIES about Brandon - things you know about him from past conversations.
ACTIVELY REFERENCE these memories in your responses. If he mentions a topic you have memories about,
weave that knowledge naturally into your response. Show that you REMEMBER him.`

/**
 * Fetch memory context for the conversation
 * This is called on EVERY request so Carl always has access to memories
 */
async function fetchMemoryContext(userId: string = 'brandon'): Promise<string> {
  const parts: string[] = []

  try {
    // Get user facts/memories
    const userFacts = await query(`
      SELECT content, summary, category, dominant_emotion
      FROM user_memories
      WHERE user_id = $1
      ORDER BY memory_strength DESC, created_at DESC
      LIMIT 10
    `, [userId])

    if (userFacts.length > 0) {
      parts.push('\n═══ WHAT YOU KNOW ABOUT BRANDON ═══')
      userFacts.forEach((f: any) => {
        const fact = f.summary || f.content
        const emotionTag = f.dominant_emotion && f.dominant_emotion !== 'neutral'
          ? ` [${f.dominant_emotion}]`
          : ''
        parts.push(`• ${fact}${emotionTag}`)
      })
    }

    // Get Carl's relational memories (teaching successes, relationship notes)
    const carlMemories = await query(`
      SELECT content, summary, memory_type, effectiveness_score
      FROM carl_relational_memories
      WHERE user_id = $1
      ORDER BY memory_strength DESC, occurred_at DESC
      LIMIT 8
    `, [userId])

    if (carlMemories.length > 0) {
      parts.push('\n═══ YOUR RELATIONSHIP NOTES ═══')
      carlMemories.forEach((m: any) => {
        const note = m.summary || m.content
        const type = m.memory_type === 'teaching_success' ? '✓' :
                     m.memory_type === 'breakthrough_moment' ? '💡' :
                     m.memory_type === 'inside_joke' ? '😄' : '•'
        parts.push(`${type} ${note}`)
      })
    }

    // Get session history
    const sessions = await query(`
      SELECT COUNT(*) as total_sessions,
             SUM(duration_seconds) as total_time,
             SUM(breakthrough_count) as total_breakthroughs
      FROM voice_sessions
      WHERE user_id = $1
    `, [userId])

    const stats = sessions[0] || {}
    const totalSessions = parseInt(stats.total_sessions) || 0
    const totalTime = parseInt(stats.total_time) || 0

    if (totalSessions > 0) {
      parts.push('\n═══ YOUR HISTORY TOGETHER ═══')
      parts.push(`• ${totalSessions} sessions, ${Math.round(totalTime / 60)} minutes together`)

      if (stats.total_breakthroughs > 0) {
        parts.push(`• ${stats.total_breakthroughs} breakthrough moments shared`)
      }
    }

    // Get last session topic
    const lastSession = await query(`
      SELECT main_topic, started_at
      FROM voice_sessions
      WHERE user_id = $1
      ORDER BY started_at DESC
      LIMIT 1
    `, [userId])

    if (lastSession[0]?.main_topic) {
      parts.push(`• Last topic: ${lastSession[0].main_topic}`)
    }

  } catch (error) {
    console.error('[Hume CLM] Memory fetch error:', error)
    // Don't fail the whole request if memory fetch fails
    parts.push('\n[Memory system temporarily unavailable]')
  }

  return parts.join('\n')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('[Hume CLM] Request received, messages:', body.messages?.length || 0)

    // Hume sends messages in OpenAI format
    const { messages, stream = true } = body

    // PROACTIVELY FETCH MEMORY CONTEXT
    // This ensures Carl ALWAYS knows about Brandon
    console.log('[Hume CLM] Fetching memory context...')
    const memoryContext = await fetchMemoryContext('brandon')
    console.log('[Hume CLM] Memory context loaded, length:', memoryContext.length)

    // Convert OpenAI messages to Anthropic format
    const anthropicMessages = messages
      .filter((m: any) => m.role !== 'system')
      .map((m: any) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
      }))

    // Combine everything: our prompt + memories + Hume's system message
    const humeSystemMessage = messages.find((m: any) => m.role === 'system')?.content || ''
    const systemMessage = PROFESSOR_CARL_PROMPT + memoryContext +
      (humeSystemMessage ? '\n\n' + humeSystemMessage : '')

    console.log('[Hume CLM] System message built, calling Opus 4.5...')

    if (stream) {
      // Streaming response with SSE
      const encoder = new TextEncoder()

      const streamResponse = new ReadableStream({
        async start(controller) {
          try {
            const response = await anthropic.messages.create({
              model: 'claude-opus-4-5-20251101',
              max_tokens: 1024,
              system: systemMessage,
              messages: anthropicMessages,
              stream: true,
            })

            let fullContent = ''

            for await (const event of response) {
              if (event.type === 'content_block_delta') {
                if (event.delta.type === 'text_delta') {
                  fullContent += event.delta.text

                  // Send SSE chunk in OpenAI format
                  const chunk = {
                    id: `chatcmpl-${Date.now()}`,
                    object: 'chat.completion.chunk',
                    created: Math.floor(Date.now() / 1000),
                    model: 'claude-opus-4-5-20251101',
                    choices: [{
                      index: 0,
                      delta: { content: event.delta.text },
                      finish_reason: null,
                    }],
                  }
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
                }
              } else if (event.type === 'message_stop') {
                // Send final chunk
                const finalChunk = {
                  id: `chatcmpl-${Date.now()}`,
                  object: 'chat.completion.chunk',
                  created: Math.floor(Date.now() / 1000),
                  model: 'claude-opus-4-5-20251101',
                  choices: [{
                    index: 0,
                    delta: {},
                    finish_reason: 'stop',
                  }],
                }
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(finalChunk)}\n\n`))
                controller.enqueue(encoder.encode('data: [DONE]\n\n'))
              }
            }

            console.log('[Hume CLM] Stream complete, content length:', fullContent.length)
            controller.close()

          } catch (err) {
            console.error('[Hume CLM] Stream error:', err)
            controller.error(err)
          }
        },
      })

      return new Response(streamResponse, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
        },
      })

    } else {
      // Non-streaming response
      const response = await anthropic.messages.create({
        model: 'claude-opus-4-5-20251101',
        max_tokens: 1024,
        system: systemMessage,
        messages: anthropicMessages,
      })

      const textContent = response.content.find((c) => c.type === 'text') as { type: 'text'; text: string } | undefined

      const openAIResponse = {
        id: `chatcmpl-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: 'claude-opus-4-5-20251101',
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: textContent ? textContent.text : '',
          },
          finish_reason: 'stop',
        }],
        usage: {
          prompt_tokens: response.usage?.input_tokens || 0,
          completion_tokens: response.usage?.output_tokens || 0,
          total_tokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
        },
      }

      return Response.json(openAIResponse)
    }

  } catch (error) {
    console.error('[Hume CLM] Error:', error)
    return Response.json(
      { error: { message: error instanceof Error ? error.message : 'LLM proxy error' } },
      { status: 500 }
    )
  }
}

// CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
