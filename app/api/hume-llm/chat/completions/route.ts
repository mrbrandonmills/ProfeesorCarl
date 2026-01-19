// ===========================================
// CUSTOM LLM PROXY FOR HUME EVI - SSE STREAMING
// ===========================================
// Proxies Hume EVI requests to Anthropic Claude Opus 4.5
// Uses Server-Sent Events (SSE) for streaming responses
// Endpoint: /api/hume-llm/chat/completions

import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

// Tool definitions for Professor Carl (always available to Opus)
// These are defined HERE because Hume doesn't allow tools with CUSTOM_LANGUAGE_MODEL
const CARL_TOOLS: Anthropic.Tool[] = [
  {
    name: 'get_conversation_context',
    description: 'Load context at conversation start - Brandon facts, memories, teaching approaches. Call this IMMEDIATELY when a conversation starts.',
    input_schema: {
      type: 'object' as const,
      properties: {
        topic: { type: 'string', description: 'Optional topic to focus context on' },
        depth: { type: 'string', enum: ['minimal', 'standard', 'comprehensive'], description: 'How much context to load' }
      }
    }
  },
  {
    name: 'retrieve_memory',
    description: 'Recall specific memories about Brandon or past conversations. Use when Brandon mentions something from the past or you want to reference his goals, projects, or life events.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Search query for memories' },
        types: { type: 'string', enum: ['brandon', 'carl', 'all'], description: 'Type of memories to retrieve' },
        limit: { type: 'number', description: 'Maximum number of memories to return' }
      },
      required: ['query']
    }
  },
  {
    name: 'save_insight',
    description: 'Save important new information Brandon shares for future conversations. Use when he shares NEW facts, preferences, goals, or breakthrough moments.',
    input_schema: {
      type: 'object' as const,
      properties: {
        content: { type: 'string', description: 'The insight to save' },
        insight_type: {
          type: 'string',
          enum: ['brandon_fact', 'brandon_preference', 'brandon_goal', 'teaching_success', 'breakthrough_moment', 'inside_joke', 'relationship_insight'],
          description: 'Category of the insight'
        },
        importance: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], description: 'Importance level' }
      },
      required: ['content', 'insight_type']
    }
  },
  {
    name: 'search_videos',
    description: 'Find educational YouTube videos on a topic. Brandon is a visual learner! Use when he asks about a complex topic or says "show me". Videos are automatically saved to memory so you can reference them later.',
    input_schema: {
      type: 'object' as const,
      properties: {
        topic: { type: 'string', description: 'Topic to search for videos about' },
        limit: { type: 'number', description: 'Maximum number of videos to return (default: 3, max: 5)' }
      },
      required: ['topic']
    }
  }
]

// Professor Carl system prompt - THIS IS THE MAIN PROMPT, controls everything
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

MEMORY:
You have tools to retrieve and save memories. Use them:
- At conversation start, call get_conversation_context to know Brandon's background
- When he mentions past topics, use retrieve_memory
- When he shares something important, use save_insight

Be the professor everyone wishes they had - brilliant, warm, invested in your student's success.`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('[Hume CLM] Request received, messages:', body.messages?.length || 0)

    // Hume sends messages in OpenAI format (tools are ignored, we use CARL_TOOLS)
    const { messages, stream = true } = body

    // Convert OpenAI messages to Anthropic format
    const anthropicMessages = messages
      .filter((m: any) => m.role !== 'system')
      .map((m: any) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
      }))

    // Combine Hume's system message with our Professor Carl prompt
    const humeSystemMessage = messages.find((m: any) => m.role === 'system')?.content || ''
    const systemMessage = PROFESSOR_CARL_PROMPT + (humeSystemMessage ? '\n\n' + humeSystemMessage : '')

    // NOTE: We ignore tools from Hume request and always use CARL_TOOLS
    // This is because Hume CLM doesn't support tools in config, but we need tools
    // Tools are defined at the top of this file in CARL_TOOLS constant
    console.log('[Hume CLM] Using CARL_TOOLS (4 tools: context, memory, save, videos)')

    console.log('[Hume CLM] Calling Opus 4.5, stream:', stream)

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
              tools: CARL_TOOLS,
              stream: true,
            })

            let fullContent = ''
            let toolCalls: any[] = []
            let currentToolCall: any = null

            for await (const event of response) {
              if (event.type === 'content_block_start') {
                if (event.content_block.type === 'text') {
                  // Text content starting
                } else if (event.content_block.type === 'tool_use') {
                  currentToolCall = {
                    id: event.content_block.id,
                    type: 'function',
                    function: {
                      name: event.content_block.name,
                      arguments: '',
                    },
                  }
                }
              } else if (event.type === 'content_block_delta') {
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
                } else if (event.delta.type === 'input_json_delta' && currentToolCall) {
                  currentToolCall.function.arguments += event.delta.partial_json
                }
              } else if (event.type === 'content_block_stop') {
                if (currentToolCall) {
                  toolCalls.push(currentToolCall)
                  currentToolCall = null
                }
              } else if (event.type === 'message_stop') {
                // Send final chunk
                const finishReason = toolCalls.length > 0 ? 'tool_calls' : 'stop'
                const finalChunk = {
                  id: `chatcmpl-${Date.now()}`,
                  object: 'chat.completion.chunk',
                  created: Math.floor(Date.now() / 1000),
                  model: 'claude-opus-4-5-20251101',
                  choices: [{
                    index: 0,
                    delta: toolCalls.length > 0 ? { tool_calls: toolCalls } : {},
                    finish_reason: finishReason,
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
        tools: CARL_TOOLS,
      })

      const textContent = response.content.find((c) => c.type === 'text') as { type: 'text'; text: string } | undefined
      const toolUses = response.content.filter((c) => c.type === 'tool_use') as Array<{ type: 'tool_use'; id: string; name: string; input: unknown }>

      const openAIResponse = {
        id: `chatcmpl-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: 'claude-opus-4-5-20251101',
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: textContent ? textContent.text : null,
            ...(toolUses.length > 0 && {
              tool_calls: toolUses.map((t: any) => ({
                id: t.id,
                type: 'function',
                function: {
                  name: t.name,
                  arguments: JSON.stringify(t.input),
                },
              })),
            }),
          },
          finish_reason: toolUses.length > 0 ? 'tool_calls' : 'stop',
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
