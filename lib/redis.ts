import { Redis } from "@upstash/redis";

let client: Redis | null = null;

/**
 * Upstash Redis (REST) — Vercel Edge Runtime uyumlu.
 * URL veya token yoksa `null` döner (fail-safe).
 */
export function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;

  if (!client) {
    client = new Redis({ url, token });
  }
  return client;
}
