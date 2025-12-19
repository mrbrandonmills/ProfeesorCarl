/**
 * Canvas OAuth Token Management
 * Handles OAuth flow and token storage
 */

import { query, queryOne, execute } from '@/lib/db/postgres'

export interface CanvasToken {
  access_token: string
  refresh_token?: string
  expires_at: Date
  canvas_instance_url: string
}

// Get Canvas OAuth configuration from environment
function getCanvasConfig() {
  const clientId = process.env.CANVAS_CLIENT_ID
  const clientSecret = process.env.CANVAS_CLIENT_SECRET
  const platformUrl = process.env.CANVAS_PLATFORM_URL

  if (!clientId || !clientSecret || !platformUrl) {
    throw new Error('Canvas OAuth not configured. Set CANVAS_CLIENT_ID, CANVAS_CLIENT_SECRET, and CANVAS_PLATFORM_URL.')
  }

  return {
    clientId,
    clientSecret,
    platformUrl: platformUrl.replace(/\/$/, ''),
  }
}

/**
 * Generate the Canvas OAuth authorization URL
 */
export function getCanvasAuthUrl(redirectUri: string, state: string): string {
  const config = getCanvasConfig()

  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    state,
    scope: 'url:GET|/api/v1/users/:user_id url:GET|/api/v1/courses url:GET|/api/v1/courses/:course_id url:GET|/api/v1/courses/:course_id/modules url:GET|/api/v1/courses/:course_id/pages',
  })

  return `${config.platformUrl}/login/oauth2/auth?${params.toString()}`
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<CanvasToken> {
  const config = getCanvasConfig()

  const response = await fetch(`${config.platformUrl}/login/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: redirectUri,
      code,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to exchange code: ${errorText}`)
  }

  const data = await response.json()

  // Calculate expiry (Canvas tokens typically last 1 hour)
  const expiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000)

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: expiresAt,
    canvas_instance_url: config.platformUrl,
  }
}

/**
 * Refresh an expired token
 */
export async function refreshAccessToken(refreshToken: string): Promise<CanvasToken> {
  const config = getCanvasConfig()

  const response = await fetch(`${config.platformUrl}/login/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to refresh token: ${errorText}`)
  }

  const data = await response.json()
  const expiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000)

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token || refreshToken,
    expires_at: expiresAt,
    canvas_instance_url: config.platformUrl,
  }
}

/**
 * Store a Canvas token in the database
 */
export async function storeCanvasToken(userId: string, token: CanvasToken): Promise<void> {
  // Ensure table exists
  await ensureCanvasTokensTable()

  // Upsert the token
  await execute(`
    INSERT INTO canvas_tokens (user_id, access_token, refresh_token, expires_at, canvas_instance_url)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (user_id)
    DO UPDATE SET
      access_token = $2,
      refresh_token = $3,
      expires_at = $4,
      canvas_instance_url = $5,
      updated_at = NOW()
  `, [userId, token.access_token, token.refresh_token, token.expires_at, token.canvas_instance_url])

  console.log('[Canvas OAuth] Token stored for user:', userId)
}

/**
 * Get stored Canvas token for a user
 * Automatically refreshes if expired
 */
export async function getCanvasToken(userId: string): Promise<CanvasToken | null> {
  await ensureCanvasTokensTable()

  const result = await queryOne<{
    access_token: string
    refresh_token: string | null
    expires_at: Date
    canvas_instance_url: string
  }>(`
    SELECT access_token, refresh_token, expires_at, canvas_instance_url
    FROM canvas_tokens
    WHERE user_id = $1
  `, [userId])

  if (!result) {
    return null
  }

  // Check if token is expired
  const now = new Date()
  const expiresAt = new Date(result.expires_at)

  if (now >= expiresAt && result.refresh_token) {
    // Token expired, try to refresh
    try {
      const newToken = await refreshAccessToken(result.refresh_token)
      await storeCanvasToken(userId, newToken)
      return newToken
    } catch (error) {
      console.error('[Canvas OAuth] Failed to refresh token:', error)
      // Delete the invalid token
      await deleteCanvasToken(userId)
      return null
    }
  }

  return {
    access_token: result.access_token,
    refresh_token: result.refresh_token || undefined,
    expires_at: expiresAt,
    canvas_instance_url: result.canvas_instance_url,
  }
}

/**
 * Delete a user's Canvas token
 */
export async function deleteCanvasToken(userId: string): Promise<void> {
  await execute(`DELETE FROM canvas_tokens WHERE user_id = $1`, [userId])
}

/**
 * Check if user has Canvas connected
 */
export async function hasCanvasToken(userId: string): Promise<boolean> {
  const token = await getCanvasToken(userId)
  return token !== null
}

/**
 * Ensure canvas_tokens table exists
 */
async function ensureCanvasTokensTable(): Promise<void> {
  try {
    await execute(`
      CREATE TABLE IF NOT EXISTS canvas_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL UNIQUE,
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        expires_at TIMESTAMPTZ NOT NULL,
        canvas_instance_url TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
  } catch (error) {
    // Table might already exist with different structure, ignore
    console.log('[Canvas OAuth] Table check:', error)
  }
}
