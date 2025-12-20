import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

export interface JWTPayload {
  userId: string
  email?: string
  role?: string
  name?: string
  courseId?: string
  purpose?: string
  iat?: number
  exp?: number
}

export function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

/**
 * Refresh an expired token within a grace period
 * Allows tokens that expired within the last 24 hours to be refreshed
 */
export function refreshToken(oldToken: string): string | null {
  try {
    // Verify old token, allowing expired tokens
    const decoded = jwt.verify(oldToken, JWT_SECRET, {
      ignoreExpiration: true
    }) as JWTPayload

    // Check if token is within grace period (expired < 24h ago)
    const exp = decoded.exp || 0
    const now = Math.floor(Date.now() / 1000)
    const gracePeriod = 24 * 60 * 60 // 24 hours

    // If not expired yet, just return a new token
    if (exp > now) {
      return signToken({
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        name: decoded.name
      })
    }

    // If expired more than 24 hours ago, reject
    if (now - exp > gracePeriod) {
      return null
    }

    // Issue new token
    return signToken({
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name
    })
  } catch {
    return null
  }
}
