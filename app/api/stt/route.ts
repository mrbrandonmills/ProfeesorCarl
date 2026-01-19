import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { verifyToken } from '@/lib/auth/jwt'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Speech-to-Text Endpoint for Studio Mode
 * Accepts audio file upload and returns Whisper transcription
 * Used by Professor Carl Mobile's Studio Voice feature
 */

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)

    // Check for guest/demo tokens (allow for testing)
    const isGuestToken = token.startsWith('guest-token-')
    const isDemoToken = token.startsWith('demo-token-') || token.startsWith('local-token-')

    let userId: string
    if (isGuestToken || isDemoToken) {
      userId = token.replace('guest-token-', '').replace('demo-token-', '').replace('local-token-', '')
      console.log('[STT] Guest/demo access:', userId)
    } else {
      const payload = verifyToken(token)
      if (!payload) {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        )
      }
      userId = payload.userId
    }

    // Parse multipart form data
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      )
    }

    console.log('[STT] Transcribing audio for user:', userId, 'File size:', audioFile.size)

    // Call OpenAI Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en', // Optimize for English
      response_format: 'json',
    })

    console.log('[STT] Transcription complete:', transcription.text.substring(0, 100))

    return NextResponse.json({
      success: true,
      transcript: transcription.text,
    })

  } catch (error) {
    console.error('[STT] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to transcribe audio' },
      { status: 500 }
    )
  }
}
