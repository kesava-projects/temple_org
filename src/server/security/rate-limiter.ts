import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// In-memory sliding window cache for local development and environments without Upstash Redis
interface MemoryEntry {
  timestamps: number[];
}

const memoryStore = new Map<string, MemoryEntry>();

function memorySlidingWindow(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now();
  const entry = memoryStore.get(key) || { timestamps: [] };

  // Filter out timestamps outside window
  const validTimestamps = entry.timestamps.filter((ts) => now - ts < windowMs);

  if (validTimestamps.length >= limit) {
    const oldestTimestamp = validTimestamps[0] ?? now;
    const reset = oldestTimestamp + windowMs;
    memoryStore.set(key, { timestamps: validTimestamps });
    return {
      success: false,
      limit,
      remaining: 0,
      reset,
    };
  }

  validTimestamps.push(now);
  memoryStore.set(key, { timestamps: validTimestamps });

  return {
    success: true,
    limit,
    remaining: limit - validTimestamps.length,
    reset: now + windowMs,
  };
}

export type RateLimitType = "auth" | "otp" | "invite" | "booking";

interface RateLimitConfig {
  limit: number;
  windowSeconds: number;
  windowMs: number;
}

const LIMIT_CONFIGS: Record<RateLimitType, RateLimitConfig> = {
  // Security Rule 8: Rate limit login, OTP, invite and booking endpoints
  auth: { limit: 5, windowSeconds: 60, windowMs: 60 * 1000 }, // 5 req / 1 min
  otp: { limit: 3, windowSeconds: 300, windowMs: 300 * 1000 }, // 3 req / 5 min
  invite: { limit: 5, windowSeconds: 600, windowMs: 600 * 1000 }, // 5 req / 10 min
  booking: { limit: 10, windowSeconds: 60, windowMs: 60 * 1000 }, // 10 req / 1 min
};

let redisClient: Redis | null = null;
const ratelimitInstances = new Map<RateLimitType, Ratelimit>();

function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token && !url.includes("placeholder") && !url.includes("your-upstash")) {
    try {
      redisClient = new Redis({ url, token });
      return redisClient;
    } catch {
      return null;
    }
  }

  return null;
}

function getUpstashRatelimit(type: RateLimitType): Ratelimit | null {
  const redis = getRedisClient();
  if (!redis) return null;

  if (ratelimitInstances.has(type)) {
    return ratelimitInstances.get(type)!;
  }

  const config = LIMIT_CONFIGS[type];
  const instance = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.limit, `${config.windowSeconds} s`),
    prefix: `@temple/ratelimit/${type}`,
  });

  ratelimitInstances.set(type, instance);
  return instance;
}

export async function checkRateLimit(
  identifier: string,
  type: RateLimitType
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const config = LIMIT_CONFIGS[type];
  const compositeKey = `${type}:${identifier}`;

  try {
    const upstashLimiter = getUpstashRatelimit(type);
    if (upstashLimiter) {
      const result = await upstashLimiter.limit(compositeKey);
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      };
    }
  } catch (error) {
    console.warn("[RateLimit] Upstash Redis request failed, falling back to memory store:", error);
  }

  // Graceful fallback to memory store
  return memorySlidingWindow(compositeKey, config.limit, config.windowMs);
}

// Helper to reset memory store for testing
export function _resetMemoryRateLimitStore(): void {
  memoryStore.clear();
}
