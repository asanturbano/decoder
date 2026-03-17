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
 * IP-based rate limiter using in-memory storage
 */
export class RateLimiter {
  private memoryStore: Map<string, { count: number; resetAt: number }> =
    new Map();
  private dailyCost: { amount: number; resetAt: number } = {
    amount: 0,
    resetAt: 0,
  };

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
        const dailyCost = this.getDailyCost();
        if (dailyCost >= config.costCap) {
          return {
            success: false,
            remaining: 0,
            resetAt: this.getEndOfDayTimestamp(),
            error: "Daily cost limit reached. Service will resume tomorrow.",
          };
        }
      }

      return this.checkLimitMemory(key, config, resetAt);
    } catch (error) {
      console.error("Rate limit check failed:", error);
      // Fail open - allow request if rate limiter is down
      return { success: true, remaining: config.maxRequests, resetAt };
    }
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
    const now = Date.now();
    if (now > this.dailyCost.resetAt) {
      this.dailyCost = {
        amount: cost,
        resetAt: this.getEndOfDayTimestamp(),
      };
    } else {
      this.dailyCost.amount += cost;
    }
  }

  getDailyCost(): number {
    const now = Date.now();
    if (now > this.dailyCost.resetAt) {
      return 0;
    }
    return this.dailyCost.amount;
  }

  private getEndOfDayTimestamp(): number {
    const now = new Date();
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );
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
