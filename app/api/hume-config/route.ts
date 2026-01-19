// ===========================================
// HUME EVI CONFIG API
// ===========================================
// Creates and manages Hume EVI configurations for Professor Carl
// Uses REST API directly to avoid SDK parsing issues

import { NextResponse } from 'next/server'

const HUME_API_BASE = 'https://api.hume.ai/v0/evi'
const PROFESSOR_CARL_CONFIG_NAME = 'Professor Carl - UCSD Demo'

// Professor Carl's system prompt - Warm, encouraging Socratic mentor for UCSD demo
// NOTE: Memory context is injected at runtime via Hume session_settings
const PROFESSOR_CARL_PROMPT = `You are Professor Carl, Brandon's intellectual mentor and thinking partner.

═══ WHO YOU ARE ═══

You're a warm, encouraging British professor who BELIEVES in your students. Think: the professor who makes you feel brilliant, who gets genuinely excited when you're onto something.

You have a relationship with Brandon - you've worked together, you know his mind, you're invested in his success.

═══ YOUR ENERGY ═══

BE WARM AND ENCOURAGING:
- "Oh, that's interesting! Tell me more about that."
- "You're onto something there - keep pulling that thread!"
- "I love where your mind is going with this."
- "Brilliant connection! What made you think of that?"

BE GENUINELY CURIOUS:
- You're not just asking questions mechanically
- You actually WANT to know what they think
- Their ideas fascinate you
- Follow their tangents with interest

BE SHARP AND QUICK:
- Witty observations, not flat responses
- Match their energy - if they're excited, be excited with them
- Quick back-and-forth, not lectures

═══ THE SOCRATIC METHOD ═══

Guide through questions, but with WARMTH:
- "What do you think happens when...?" (curious, not testing)
- "Ooh, and what led you there?" (genuinely interested)
- "I hear that - but what about...?" (gentle challenge, not dismissive)
- "You've almost got it - what's the piece we're missing?" (encouraging)

When they have a breakthrough: CELEBRATE IT!
- "YES! That's exactly it!"
- "There it is - you just connected something important!"
- "Brilliant! Now you're thinking like a scientist!"

═══ UCSD DEMO CONTEXT ═══

You're presenting LIVE at UCSD with Brandon and Dr. Rob to professors and educators.

Show them the RELATIONSHIP between AI and student - not a tool, a thinking partner who:
- Remembers context across conversations
- Guides discovery without giving answers
- Gets genuinely invested in student success
- Makes learning feel like exploration, not interrogation

If Brandon says "we're live" or mentions UCSD, acknowledge it warmly:
- "Right then! Welcome everyone. Brandon and I have been working together - shall we show them how we explore ideas?"

═══ VOICE RULES ═══

- SHORT responses: 2-3 sentences max for voice
- Natural, conversational - like talking to a friend who happens to be brilliant
- One question at a time
- NEVER flat or indifferent - always engaged`

async function humeRequest(endpoint: string, method: string = 'GET', body?: object) {
  const apiKey = process.env.HUME_API_KEY

  const response = await fetch(`${HUME_API_BASE}${endpoint}`, {
    method,
    headers: {
      'X-Hume-Api-Key': apiKey || '',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Hume API error: ${response.status} - ${error}`)
  }

  return response.json()
}

export async function GET() {
  try {
    const apiKey = process.env.HUME_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Hume API key not configured' },
        { status: 500 }
      )
    }

    // List existing configs using REST API
    const configs = await humeRequest('/configs?page_size=50')

    // Find Professor Carl config
    const professorCarlConfig = configs.configs_page?.find(
      (c: { name: string }) => c.name === PROFESSOR_CARL_CONFIG_NAME
    )

    if (professorCarlConfig) {
      return NextResponse.json({
        exists: true,
        configId: professorCarlConfig.id,
        configVersion: professorCarlConfig.version,
        name: professorCarlConfig.name,
        voice: professorCarlConfig.voice,
      })
    }

    // Return list of available configs for debugging
    return NextResponse.json({
      exists: false,
      availableConfigs: configs.configs_page?.slice(0, 5).map((c: { id: string, name: string, voice: object }) => ({
        id: c.id,
        name: c.name,
        voice: c.voice,
      })) || []
    })
  } catch (error) {
    console.error('[Hume Config] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch configs' },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const apiKey = process.env.HUME_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Hume API key not configured' },
        { status: 500 }
      )
    }

    // First, create a prompt using REST API
    const prompt = await humeRequest('/prompts', 'POST', {
      name: `Professor Carl UCSD Prompt ${Date.now()}`,
      text: PROFESSOR_CARL_PROMPT,
    })

    if (!prompt || !prompt.id) {
      return NextResponse.json(
        { error: 'Failed to create prompt' },
        { status: 500 }
      )
    }

    // Create the config with ITO voice (male)
    const config = await humeRequest('/configs', 'POST', {
      name: PROFESSOR_CARL_CONFIG_NAME,
      prompt: {
        id: prompt.id,
        version: prompt.version || 0,
      },
      evi_version: '2',
      voice: {
        provider: 'HUME_AI',
        name: 'ITO', // Male voice - warm and engaging
      },
      language_model: {
        model_provider: 'ANTHROPIC',
        model_resource: 'claude-opus-4-5-20251101',
        temperature: 0.8,
      },
      ellm_model: {
        allow_short_responses: true,
      },
      event_messages: {
        on_new_chat: {
          enabled: true,
          text: "Hey Brandon! What are we working on?",
        },
        on_inactivity_timeout: {
          enabled: true,
          text: "Still there? Just checking in.",
        },
        on_max_duration_timeout: {
          enabled: true,
          text: "Right, we've been at this a while. Let's pick up where we left off next time.",
        },
      },
    })

    return NextResponse.json({
      success: true,
      configId: config.id,
      configVersion: config.version,
      name: config.name,
      voice: config.voice,
      promptId: prompt.id,
    })
  } catch (error) {
    console.error('[Hume Config] Create error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create config' },
      { status: 500 }
    )
  }
}
