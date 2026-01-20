// Simple Hume config that routes to OUR custom LLM endpoint
// This gives us FULL control over the prompt - no Hume defaults

import { NextResponse } from 'next/server'

const HUME_API_BASE = 'https://api.hume.ai/v0/evi'

export async function POST() {
  const apiKey = process.env.HUME_API_KEY
  
  if (!apiKey) {
    return NextResponse.json({ error: 'No Hume API key' }, { status: 500 })
  }

  try {
    // ALWAYS use production URL - deployment-specific URLs break when we redeploy
    const baseUrl = 'https://profeesor-carl.vercel.app'

    console.log('[Simple Config] Creating config with custom LLM at:', baseUrl)

    // Create config with CUSTOM_LANGUAGE_MODEL pointing to our endpoint
    // Note: Hume disallows prompts with CUSTOM_LANGUAGE_MODEL - the prompt lives in our endpoint
    const configRes = await fetch(`${HUME_API_BASE}/configs`, {
      method: 'POST',
      headers: {
        'X-Hume-Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `Professor Carl CLM ${Date.now()}`,
        evi_version: '3',
        voice: {
          provider: 'HUME_AI',
          name: 'Male English Actor', // British male voice
        },
        language_model: {
          model_provider: 'CUSTOM_LANGUAGE_MODEL',
          model_resource: `${baseUrl}/api/hume-llm/chat/completions`,
        },
        ellm_model: {
          allow_short_responses: true,
        },
        event_messages: {
          on_new_chat: {
            enabled: true,
            text: "Hey Brandon! What are we exploring today?",
          },
          on_inactivity_timeout: {
            enabled: true,
            text: "Still there?",
          },
        },
      }),
    })

    if (!configRes.ok) {
      const err = await configRes.text()
      console.error('[Simple Config] Config creation failed:', err)
      return NextResponse.json({ error: 'Config creation failed', details: err }, { status: 500 })
    }

    const config = await configRes.json()
    console.log('[Simple Config] Config created:', config.id)

    return NextResponse.json({
      success: true,
      configId: config.id,
      llmEndpoint: `${baseUrl}/api/hume-llm/chat/completions`,
    })

  } catch (error) {
    console.error('[Simple Config] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Config creation failed' },
      { status: 500 }
    )
  }
}
