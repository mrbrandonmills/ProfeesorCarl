// ===========================================
// HUME VOICE LIBRARY API
// ===========================================
// Lists all available voices in Hume Voice Library

import { NextResponse } from 'next/server'

const HUME_API_BASE = 'https://api.hume.ai/v0/evi'

async function humeRequest(endpoint: string) {
  const apiKey = process.env.HUME_API_KEY

  const response = await fetch(`${HUME_API_BASE}${endpoint}`, {
    method: 'GET',
    headers: {
      'X-Hume-Api-Key': apiKey || '',
      'Content-Type': 'application/json',
    },
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

    // List all voices - paginated
    const allVoices: any[] = []
    let pageNumber = 0
    let hasMore = true

    while (hasMore) {
      const response = await humeRequest(`/voices?page_number=${pageNumber}&page_size=100&provider=HUME_AI`)

      if (response.voices_page && response.voices_page.length > 0) {
        allVoices.push(...response.voices_page)
        pageNumber++
        hasMore = response.voices_page.length === 100
      } else {
        hasMore = false
      }
    }

    // Group by voice characteristics if available
    const voiceList = allVoices.map((v: any) => ({
      name: v.name,
      id: v.id,
      provider: v.provider,
      parameters: v.parameters,
    }))

    return NextResponse.json({
      total: voiceList.length,
      voices: voiceList,
    })
  } catch (error) {
    console.error('[Hume Voices] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch voices' },
      { status: 500 }
    )
  }
}
