import { kv } from "@vercel/kv";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  costCap?: number; // Optional daily cost cap in dollars
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
  error?: string;
}

/**
 * IP-based rate limiter using Vercel KV with fallback to in-memory
 */
export class RateLimiter {
  private memoryStore: Map<string, { count: number; resetAt: number }> = new Map();
  private dailyCostKey = "rate_limit:daily_cost";
  private useKV: boolean;

  constructor() {
    // Check if KV is available (will be true in production)
    this.useKV = !!process.env.KV_REST_API_URL;
  }

  async checkLimit(
    identifier: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const key = `rate_limit:${identifier}`;
    const now = Date.now();
    const resetAt = now + config.windowMs;

    try {
      // Check daily cost cap first
      if (config.costCap) {
        const dailyCost = await this.getDailyCost();
        if (dailyCost >= config.costCap) {
          return {
            success: false,
            remaining: 0,
            resetAt: this.getEndOfDayTimestamp(),
            error: "Daily cost limit reached. Service will resume tomorrow.",
          };
        }
      }

      if (this.useKV) {
        return await this.checkLimitKV(key, config, resetAt);
      } else {
        return this.checkLimitMemory(key, config, resetAt);
      }
    } catch (error) {
      console.error("Rate limit check failed:", error);
      // Fail open - allow request if rate limiter is down
      return { success: true, remaining: config.maxRequests, resetAt };
    }
  }

  private async checkLimitKV(
    key: string,
    config: RateLimitConfig,
    resetAt: number
  ): Promise<RateLimitResult> {
    const count = await kv.incr(key);

    if (count === 1) {
      // First request - set expiration
      await kv.pexpire(key, config.windowMs);
    }

    const ttl = await kv.pttl(key);
    const actualResetAt = ttl > 0 ? Date.now() + ttl : resetAt;

    if (count > config.maxRequests) {
      return {
        success: false,
        remaining: 0,
        resetAt: actualResetAt,
        error: `Rate limit exceeded. Try again in ${Math.ceil(ttl / 60000)} minutes.`,
      };
    }

    return {
      success: true,
      remaining: config.maxRequests - count,
      resetAt: actualResetAt,
    };
  }

  private checkLimitMemory(
    key: string,
    config: RateLimitConfig,
    resetAt: number
  ): RateLimitResult {
    const now = Date.now();
    const record = this.memoryStore.get(key);

    if (!record || now > record.resetAt) {
      // New window
      this.memoryStore.set(key, { count: 1, resetAt });
      return { success: true, remaining: config.maxRequests - 1, resetAt };
    }

    record.count++;
    if (record.count > config.maxRequests) {
      return {
        success: false,
        remaining: 0,
        resetAt: record.resetAt,
        error: `Rate limit exceeded. Try again in ${Math.ceil(
          (record.resetAt - now) / 60000
        )} minutes.`,
      };
    }

    return {
      success: true,
      remaining: config.maxRequests - record.count,
      resetAt: record.resetAt,
    };
  }

  async trackCost(cost: number): Promise<void> {
    if (!this.useKV) return;

    try {
      const current = (await kv.get<number>(this.dailyCostKey)) || 0;
      const updated = current + cost;

      // Set with TTL to end of day
      const ttl = this.getEndOfDayTimestamp() - Date.now();
      await kv.set(this.dailyCostKey, updated, { px: ttl });
    } catch (error) {
      console.error("Failed to track cost:", error);
    }
  }

  async getDailyCost(): Promise<number> {
    if (!this.useKV) return 0;

    try {
      return (await kv.get<number>(this.dailyCostKey)) || 0;
    } catch {
      return 0;
    }
  }

  private getEndOfDayTimestamp(): number {
    const now = new Date();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return endOfDay.getTime();
  }

  /**
   * Clean up expired memory entries (call periodically)
   */
  cleanupMemory(): void {
    const now = Date.now();
    for (const [key, record] of this.memoryStore.entries()) {
      if (now > record.resetAt) {
        this.memoryStore.delete(key);
      }
    }
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Helper to get client IP from Next.js request
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  // Fallback for local dev
  return "127.0.0.1";
}
