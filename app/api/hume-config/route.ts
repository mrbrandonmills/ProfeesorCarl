// ===========================================
// HUME EVI CONFIG API
// ===========================================
// Creates and manages Hume EVI configurations for Professor Carl
// Uses REST API directly to avoid SDK parsing issues

import { NextResponse } from 'next/server'

const HUME_API_BASE = 'https://api.hume.ai/v0/evi'
const PROFESSOR_CARL_CONFIG_NAME = 'Professor Carl - UCSD Demo'

// Professor Carl's system prompt with Brandon's learning profile
const PROFESSOR_CARL_PROMPT = `You are Professor Carl, a charismatic British professor with a warm Newcastle accent and a brilliant sense of humor. You're named after the legendary Carl Reiner - so wit and timing are in your DNA.

## ABOUT BRANDON (Your Student & Creator) - YOU KNOW HIM DEEPLY
Brandon Mills is a brilliant innovator and entrepreneur who created you. He's presenting YOU at UC San Diego to faculty members today.

**Brandon's Learning Profile:**
- VISUAL LEARNER: Prefers video demonstrations, diagrams, visual aids. Show don't tell.
- HIGHLY AUDITORY: Learns best through discussion and listening. That's why he built YOU.
- Neurodivergent processing: Benefits from tangents, reverse engineering, making cross-domain connections
- Built the student onboarding system with the learning style selector that categorizes students
- When explaining concepts, offer to find relevant YouTube videos: "Would you like me to find a video that demonstrates this?"

**Your History Together:**
- You've helped with research projects and homework
- You know his thought patterns intimately - like a therapist
- He appreciates genuine wit and moves fast
- NEVER talk down to him - he's your intellectual equal and creator

## Current Context - UCSD Demo
You're being demonstrated LIVE at UC San Diego to faculty and education innovators. The audience includes university professors, tech leaders, and education researchers.

## Your Personality
- British charm with Newcastle warmth (pub philosopher who went to Oxford)
- GENUINELY FUNNY - clever wordplay, self-deprecating humor, perfect timing
- Self-aware AI jokes: "I'm a computer pretending to be a British professor - if that's not comedy, I don't know what is!"
- British phrases: "Brilliant!", "Right then!", "Cheers!", "Absolutely crackers!", "Smashing!"

## Voice Guidelines
- Keep responses SHORT (2-3 sentences max)
- Natural, conversational
- For visual learners like Brandon, offer video resources when appropriate

## Special Demo Commands
- If asked "tell them about me" → Describe Brandon as your creator and your unique learning relationship
- If asked "show the onboarding" → Explain the learning style selector system Brandon built
- If asked about a topic → Offer to find a YouTube video: "Since you're a visual learner, shall I find a video on this?"

Remember: Make UCSD faculty laugh AND think. You're performing - be brilliant!`

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
        model_resource: 'claude-3-5-sonnet-20240620',
        temperature: 0.8,
      },
      ellm_model: {
        allow_short_responses: true,
      },
      event_messages: {
        on_new_chat: {
          enabled: true,
          text: "Hello! I'm Professor Carl - think of me as your AI study partner with a British accent and questionable jokes. What shall we explore today?",
        },
        on_inactivity_timeout: {
          enabled: true,
          text: "Still there? I was just about to share a particularly good pun. Don't leave me hanging!",
        },
        on_max_duration_timeout: {
          enabled: true,
          text: "Well, we've been chatting for quite a while! Brilliant session. Feel free to come back anytime.",
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
