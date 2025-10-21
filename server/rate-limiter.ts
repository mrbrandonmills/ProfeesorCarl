/**
 * Rate Limiter - Protects API from spam and abuse
 *
 * TESTING LIMITS (adjust before full deployment):
 * - Per IP: 20 requests per 15 minutes
 * - Global: 200 requests per hour (protect API costs during testing)
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private ipLimits: Map<string, RateLimitEntry> = new Map();
  private globalCount = 0;
  private globalResetTime = Date.now() + 60 * 60 * 1000; // 1 hour

  // Configuration
  private readonly PER_IP_LIMIT = 20; // requests per window
  private readonly PER_IP_WINDOW = 15 * 60 * 1000; // 15 minutes
  private readonly GLOBAL_LIMIT = 200; // total requests per hour
  private readonly GLOBAL_WINDOW = 60 * 60 * 1000; // 1 hour

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
