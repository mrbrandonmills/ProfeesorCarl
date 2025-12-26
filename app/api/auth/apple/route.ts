import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db/postgres'
import { signToken } from '@/lib/auth/jwt'
import * as jose from 'jose'

// Apple's public key URL
const APPLE_KEYS_URL = 'https://appleid.apple.com/auth/keys'

// Cache Apple's public keys
let cachedKeys: jose.JWK[] | null = null
let keysCachedAt = 0
const KEYS_CACHE_TTL = 3600000 // 1 hour

async function getApplePublicKeys(): Promise<jose.JWK[]> {
  const now = Date.now()
  if (cachedKeys && (now - keysCachedAt) < KEYS_CACHE_TTL) {
    return cachedKeys
  }

  try {
    const response = await fetch(APPLE_KEYS_URL)
    const data = await response.json()
    cachedKeys = data.keys as jose.JWK[]
    keysCachedAt = now
    return cachedKeys!
  } catch (error) {
    console.error('[Apple Auth] Failed to fetch Apple public keys:', error)
    if (cachedKeys) return cachedKeys
    throw error
  }
}

interface VerifyResult {
  payload: jose.JWTPayload | null
  error?: string
  debug?: Record<string, unknown>
}

async function verifyAppleToken(identityToken: string): Promise<VerifyResult> {
  const debug: Record<string, unknown> = {
    tokenLength: identityToken?.length,
    tokenStart: identityToken?.substring(0, 20),
    tokenEnd: identityToken?.substring(identityToken.length - 20),
    hasThreeParts: identityToken?.split('.').length === 3,
  }

  try {
    const keys = await getApplePublicKeys()
    debug.keysCount = keys.length

    // Check if token has valid JWT format (3 parts separated by dots)
    const parts = identityToken.split('.')
    if (parts.length !== 3) {
      return {
        payload: null,
        error: `Invalid JWT format: expected 3 parts, got ${parts.length}`,
        debug
      }
    }

    const header = jose.decodeProtectedHeader(identityToken)
    debug.headerKid = header.kid
    debug.headerAlg = header.alg

    // Find the key that matches the kid in the token header
    const key = keys.find(k => k.kid === header.kid)
    if (!key) {
      debug.availableKids = keys.map(k => k.kid)
      return {
        payload: null,
        error: `No matching key found for kid: ${header.kid}`,
        debug
      }
    }

    // Import the public key
    const publicKey = await jose.importJWK(key, 'RS256')

    // Verify the token
    const { payload } = await jose.jwtVerify(identityToken, publicKey, {
      issuer: 'https://appleid.apple.com',
      audience: 'com.brandonmills.professorCarl',
    })

    debug.sub = payload.sub
    debug.email = payload.email
    return { payload, debug }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[Apple Auth] Token verification failed:', errorMessage)
    debug.errorType = error instanceof Error ? error.constructor.name : typeof error
    return { payload: null, error: errorMessage, debug }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { identityToken, userIdentifier, email, name } = await request.json()

    if (!identityToken || !userIdentifier) {
      return NextResponse.json(
        { error: 'identityToken and userIdentifier are required' },
        { status: 400 }
      )
    }

    // Verify the Apple identity token
    const verifyResult = await verifyAppleToken(identityToken)
    if (!verifyResult.payload) {
      console.error('[Apple Auth] Verification failed:', verifyResult.error, verifyResult.debug)
      return NextResponse.json(
        {
          error: 'Invalid Apple identity token',
          details: verifyResult.error,
          debug: verifyResult.debug
        },
        { status: 401 }
      )
    }

    const payload = verifyResult.payload

    // The 'sub' claim is the unique user identifier from Apple
    const appleUserId = payload.sub as string

    // Verify the userIdentifier matches
    if (appleUserId !== userIdentifier) {
      console.error('[Apple Auth] User identifier mismatch')
      return NextResponse.json(
        { error: 'User identifier mismatch' },
        { status: 401 }
      )
    }

    // Get email from token payload if not provided
    const userEmail = email || (payload.email as string)
    const userName = name || userEmail?.split('@')[0] || 'Apple User'

    // Ensure apple_user_id column exists BEFORE querying
    try {
      await execute(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS apple_user_id TEXT UNIQUE
      `)
    } catch (colError) {
      // Column might already exist or other issue - log and continue
      console.log('[Apple Auth] Column check:', colError)
    }

    // Check if user exists (by apple_user_id or email)
    let existingUser = await queryOne(
      'SELECT * FROM users WHERE apple_user_id = $1',
      [appleUserId]
    )

    if (!existingUser && userEmail) {
      existingUser = await queryOne(
        'SELECT * FROM users WHERE email = $1',
        [userEmail.toLowerCase()]
      )
    }

    let user = existingUser

    if (!user) {
      // Create new user
      user = await queryOne(`
        INSERT INTO users (name, email, role, apple_user_id)
        VALUES ($1, $2, 'student', $3)
        RETURNING id, name, email, role
      `, [userName, userEmail?.toLowerCase() || `apple-${appleUserId.substring(0, 8)}@private.appleid.com`, appleUserId])

      console.log('[Apple Auth] New user created:', user?.email)
    } else if (!existingUser.apple_user_id) {
      // Link Apple ID to existing account
      try {
        await execute(`
          UPDATE users SET apple_user_id = $1 WHERE id = $2
        `, [appleUserId, existingUser.id])
        console.log('[Apple Auth] Linked Apple ID to existing user:', existingUser.email)
      } catch (error) {
        console.log('[Apple Auth] Could not link Apple ID:', error)
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Failed to create or find user' },
        { status: 500 }
      )
    }

    // Check if user has memories (existing user with seeded data)
    // Note: memories table uses TEXT user_id (e.g., 'brandon', email prefix, or numeric id as string)
    let hasMemories = false
    try {
      // Try multiple user_id formats since memories may use different formats
      const emailPrefix = userEmail?.split('@')[0]?.toLowerCase() || ''
      const possibleUserIds = [
        user.id.toString(),           // numeric id as string
        emailPrefix,                   // email prefix like 'brandon'
        userEmail?.toLowerCase(),      // full email
      ].filter(Boolean)

      console.log('[Apple Auth] Checking memories for user_ids:', possibleUserIds)

      for (const uid of possibleUserIds) {
        const memoryCount = await queryOne(
          'SELECT COUNT(*) as count FROM user_memories WHERE user_id = $1',
          [uid]
        )
        if (memoryCount && parseInt(memoryCount.count) > 0) {
          hasMemories = true
          console.log('[Apple Auth] Found memories with user_id:', uid, 'count:', memoryCount.count)
          break
        }
      }

      if (!hasMemories) {
        console.log('[Apple Auth] No memories found for any user_id format')
      }
    } catch (memError) {
      console.log('[Apple Auth] Could not check memories:', memError)
    }

    // Generate JWT token
    const token = signToken({
      userId: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
    })

    // Track if this was an existing user (found by email/apple_user_id)
    const isNewUser = !existingUser

    // Create response with token
    const response = NextResponse.json({
      success: true,
      token: token,
      userId: user.id,
      isNewUser: isNewUser,
      hasMemories: hasMemories,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })

    // Set auth cookie (7 days)
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    console.log('[Apple Auth] User signed in:', user.email)

    return response
  } catch (error) {
    console.error('[Apple Auth] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Apple Sign In failed' },
      { status: 500 }
    )
  }
}
