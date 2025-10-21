/**
 * Rate Limiter - Protects API from spam and abuse
 *
 * ⚠️ LIMITATION: This uses in-memory storage which doesn't work perfectly
 * with Vercel's serverless architecture. Each serverless instance has its
 * own memory, so limits are PER INSTANCE, not global.
 *
 * For testing: Limits are VERY aggressive to catch issues
 * For production: Use Upstash Redis or Vercel KV for proper rate limiting
 *
 * CURRENT LIMITS (very strict for testing):
 * - Per IP: 10 requests per 5 minutes
 * - Global (per instance): 50 requests per 15 minutes
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private ipLimits: Map<string, RateLimitEntry> = new Map();
  private globalCount = 0;
  private globalResetTime = Date.now() + 15 * 60 * 1000; // 15 minutes

  // Configuration - AGGRESSIVE for testing
  private readonly PER_IP_LIMIT = 10; // requests per window (lowered from 20)
  private readonly PER_IP_WINDOW = 5 * 60 * 1000; // 5 minutes (lowered from 15)
  private readonly GLOBAL_LIMIT = 50; // total requests per instance (lowered from 200)
  private readonly GLOBAL_WINDOW = 15 * 60 * 1000; // 15 minutes (lowered from 60)

  /**
   * Check if request should be allowed
   * Returns: { allowed: boolean, retryAfter?: number, reason?: string }
   */
  checkLimit(ip: string): {
    allowed: boolean;
    retryAfter?: number;
    reason?: string;
    remaining?: number;
  } {
    const now = Date.now();

    // Check global limit first (protect API costs)
    if (now >= this.globalResetTime) {
      // Reset global counter
      this.globalCount = 0;
      this.globalResetTime = now + this.GLOBAL_WINDOW;
    }

    if (this.globalCount >= this.GLOBAL_LIMIT) {
      return {
        allowed: false,
        retryAfter: Math.ceil((this.globalResetTime - now) / 1000),
        reason: 'Global rate limit reached. This protects API costs during testing.',
      };
    }

    // Check per-IP limit
    let entry = this.ipLimits.get(ip);

    if (!entry || now >= entry.resetTime) {
      // Create new entry or reset expired one
      entry = {
        count: 0,
        resetTime: now + this.PER_IP_WINDOW,
      };
      this.ipLimits.set(ip, entry);
    }

    if (entry.count >= this.PER_IP_LIMIT) {
      return {
        allowed: false,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        reason: 'Too many requests. Please wait before sending more messages.',
      };
    }

    // Allow request and increment counters
    entry.count++;
    this.globalCount++;

    return {
      allowed: true,
      remaining: this.PER_IP_LIMIT - entry.count,
    };
  }

  /**
   * Cleanup old entries (prevents memory leak)
   * Call this periodically
   */
  cleanup(): void {
    const now = Date.now();
    for (const [ip, entry] of this.ipLimits.entries()) {
      if (now >= entry.resetTime) {
        this.ipLimits.delete(ip);
      }
    }
  }

  /**
   * Get current stats (for monitoring)
   */
  getStats(): {
    uniqueIPs: number;
    globalCount: number;
    globalLimit: number;
    globalResetIn: number;
  } {
    const now = Date.now();
    return {
      uniqueIPs: this.ipLimits.size,
      globalCount: this.globalCount,
      globalLimit: this.GLOBAL_LIMIT,
      globalResetIn: Math.ceil((this.globalResetTime - now) / 1000),
    };
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

// Cleanup every 5 minutes
setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);

export default rateLimiter;
