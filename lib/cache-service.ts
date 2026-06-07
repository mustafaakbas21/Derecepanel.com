import { getRedis } from "@/lib/redis";

export const DEFAULT_CACHE_TTL_SEC = 604_800; // 1 hafta

const CACHE_KEY_PREFIX = "ai_response:";

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Prompt'u SHA-256 ile hashleyerek benzersiz Redis anahtarı üretir. */
export async function generateCacheKey(prompt: string): Promise<string> {
  const hash = await sha256Hex(prompt.trim());
  return `${CACHE_KEY_PREFIX}${hash}`;
}

/** Redis'ten önbelleklenmiş yanıtı okur; hata veya yapılandırma eksikliğinde `null`. */
export async function getCachedResponse<T = unknown>(
  key: string
): Promise<T | null> {
  try {
    const redis = getRedis();
    if (!redis) return null;
    const value = await redis.get<T>(key);
    return value ?? null;
  } catch {
    return null;
  }
}

/** Yanıtı Redis'e yazar; hata durumunda sessizce atlar (fail-safe). */
export async function setCachedResponse(
  key: string,
  data: unknown,
  ttl: number = DEFAULT_CACHE_TTL_SEC
): Promise<void> {
  try {
    const redis = getRedis();
    if (!redis) return;
    await redis.set(key, data, { ex: ttl });
  } catch {
    // Redis erişilemezse LLM akışı devam eder
  }
}
