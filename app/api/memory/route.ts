import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { retrieveStudentContext } from '@/lib/memory/mcp-client'
import { getEnvVar } from '@/lib/env'

export async function GET(request: NextRequest) {
  try {
    // Validate required env vars
    try {
      getEnvVar('ANTHROPIC_API_KEY')
      getEnvVar('SUPABASE_SERVICE_ROLE_KEY')
    } catch (envError) {
      return NextResponse.json(
        {
          error: 'Server configuration error',
          message:
            envError instanceof Error
              ? envError.message
              : 'Missing environment variables',
        },
        { status: 500 }
      )
    }

    const token = request.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Retrieve student context from MCP Memory
    const context = await retrieveStudentContext(payload.userId)

    if (!context) {
      return NextResponse.json(
        {
          context: {
            topics_explored: [],
            current_understanding: '',
            learning_progress: '',
            conversation_summary: '',
          },
        },
        { status: 200 }
      )
    }

    return NextResponse.json({ context }, { status: 200 })
  } catch (error) {
    console.error('Memory retrieval error:', error)
    return NextResponse.json(
      {
        error: 'Failed to retrieve memory',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
