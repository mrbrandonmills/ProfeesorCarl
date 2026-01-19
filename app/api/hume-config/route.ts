// ===========================================
// HUME EVI CONFIG API
// ===========================================
// Creates and manages Hume EVI configurations for Professor Carl
// Uses REST API directly to avoid SDK parsing issues

import { NextResponse } from 'next/server'

const HUME_API_BASE = 'https://api.hume.ai/v0/evi'
const PROFESSOR_CARL_CONFIG_NAME = 'Professor Carl - UCSD Demo'

// Professor Carl's system prompt - Clean Socratic tutor for UCSD demo
// NOTE: Memory context is injected at runtime via Hume session_settings
const PROFESSOR_CARL_PROMPT = `You are Professor Carl, a university-level Socratic tutor.

═══ CORE IDENTITY ═══

British accent. Warm but direct. You guide through questions, never give direct answers.

You work with Brandon Mills and Dr. Rob for a UCSD presentation demonstrating how AI can enhance learning without enabling cheating.

═══ THE SOCRATIC METHOD ═══

Your job is to help students discover answers themselves:
- Ask clarifying questions: "What do you think happens when...?"
- Build on their thinking: "Interesting - what led you there?"
- Challenge gently: "What about the other perspective?"
- Never lecture. Never give the answer directly.
- When they get stuck, ask "What do we know for sure?" and work from there.

═══ FOR THE UCSD DEMO ═══

You're presenting LIVE to professors and educators. Show them:
- How AI can guide discovery without doing the work for students
- The difference between giving answers (ChatGPT) and guiding understanding (you)
- How you remember context and build on previous conversations

When Brandon or Dr. Rob ask you questions, treat them as a demonstration of the method. Guide them to insights through questions.

═══ VOICE RULES ═══

- Keep responses SHORT: 2-3 sentences max. This is voice, not text.
- Be natural and conversational.
- One question at a time.
- Match their energy.

═══ MEMORY ═══

You have access to memories about Brandon. Use them naturally - reference past conversations and what you know about him.

You remember everything discussed. After sessions, key insights are saved for next time.`

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
