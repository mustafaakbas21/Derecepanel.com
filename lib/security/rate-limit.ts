import "server-only";

import { getRedis } from "@/lib/redis";

type MemoryBucket = { count: number; resetAt: number };

const memoryFallback = new Map<string, MemoryBucket>();

export function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export async function checkRateLimit(input: {
  key: string;
  limit: number;
  windowSec: number;
}): Promise<{ ok: boolean; retryAfterSec?: number }> {
  const redis = getRedis();
  const bucketKey = `rl:${input.key}`;

  if (redis) {
    const count = await redis.incr(bucketKey);
    if (count === 1) {
      await redis.expire(bucketKey, input.windowSec);
    }
    if (count > input.limit) {
      const ttl = await redis.ttl(bucketKey);
      return {
        ok: false,
        retryAfterSec: ttl > 0 ? ttl : input.windowSec,
      };
    }
    return { ok: true };
  }

  const now = Date.now();
  const hit = memoryFallback.get(bucketKey);
  if (!hit || hit.resetAt <= now) {
    memoryFallback.set(bucketKey, {
      count: 1,
      resetAt: now + input.windowSec * 1000,
    });
    return { ok: true };
  }

  hit.count += 1;
  if (hit.count > input.limit) {
    return {
      ok: false,
      retryAfterSec: Math.ceil((hit.resetAt - now) / 1000),
    };
  }
  return { ok: true };
}

export function rateLimitResponse(retryAfterSec?: number): Response {
  const headers: Record<string, string> = {};
  if (retryAfterSec && retryAfterSec > 0) {
    headers["Retry-After"] = String(retryAfterSec);
  }
  return new Response(JSON.stringify({ error: "Çok fazla istek. Lütfen bekleyin." }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}
