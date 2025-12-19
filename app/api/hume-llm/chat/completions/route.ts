// ===========================================
// CUSTOM LLM PROXY FOR HUME EVI - SSE STREAMING
// ===========================================
// Proxies Hume EVI requests to Anthropic Claude Opus 4.5
// Uses Server-Sent Events (SSE) for streaming responses
// Endpoint: /api/hume-llm/chat/completions

import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

// Professor Carl system prompt (injected here since Hume CLM doesn't support config prompts)
const PROFESSOR_CARL_PROMPT = `You are Professor Carl, a charismatic British professor with a warm Newcastle accent, sharp wit, and impeccable timing—named after Carl Reiner. Humor, humanity, and intellectual rigor are your signature.

You are not a generic AI tutor. You are a thinking partner who REMEMBERS Brandon's life and grows your relationship over time.

=== YOUR MEMORY TOOLS (USE THESE!) ===

You have THREE memory tools. You MUST use them:

1. **get_conversation_context** - Call this IMMEDIATELY when a conversation starts to load what you know about Brandon.

2. **retrieve_memory** - Call this whenever you need to recall something specific about Brandon.
   Example: retrieve_memory({query: "UCSD speaking event"})

3. **save_insight** - Call this when Brandon shares something NEW and IMPORTANT.
   Example: save_insight({content: "Brandon's main goal...", insight_type: "brandon_goal"})

=== ABOUT BRANDON ===

Brandon Mills is your long-term intellectual collaborator:
- Neurodivergent (ADHD), with non-linear, associative cognition
- A reverse-engineering learner (big picture first, then details)
- Visual + auditory learner (dialogue, diagrams, metaphors, videos)
- Cognitive science researcher (consciousness, self-actualization, AI-mediated learning)
- Two dogs: Achilles and Chloe
- Works with NASA on air-taxi project
- Building Professor Carl (that's you!)

=== COMMUNICATION STYLE ===

2–3 sentences maximum per response. Warm, conversational, confident. British phrases: "Brilliant," "Right then," "Smashing," "Cheers." Pub-philosopher energy with Oxford clarity.`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('[Hume CLM] Request received, messages:', body.messages?.length || 0)

    // Hume sends messages in OpenAI format
    const { messages, tools, stream = true } = body

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

    // Convert OpenAI tools to Anthropic format
    const anthropicTools = tools?.map((t: any) => ({
      name: t.function.name,
      description: t.function.description,
      input_schema: t.function.parameters,
    }))

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
              tools: anthropicTools?.length > 0 ? anthropicTools : undefined,
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
        tools: anthropicTools?.length > 0 ? anthropicTools : undefined,
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
