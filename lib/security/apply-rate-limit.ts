import "server-only";

import {
  checkRateLimit,
  clientIp,
  rateLimitResponse,
} from "@/lib/security/rate-limit";

export async function enforceRateLimit(
  request: Request,
  scope: string,
  limit: number,
  windowSec: number,
  userId?: string
): Promise<Response | null> {
  try {
    const ip = clientIp(request);
    const key = userId ? `${scope}:${userId}` : `${scope}:ip:${ip}`;
    const result = await checkRateLimit({ key, limit, windowSec });
    if (!result.ok) {
      return rateLimitResponse(result.retryAfterSec);
    }
    return null;
  } catch {
    return null;
  }
}
