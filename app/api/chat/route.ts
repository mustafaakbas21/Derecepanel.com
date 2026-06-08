import { NextResponse } from "next/server";

import { AuthError } from "@/lib/auth/require-coach";
import { getServerAuthSession } from "@/lib/auth/session-server";
import { enforceRateLimit } from "@/lib/security/apply-rate-limit";
import {
  generateCacheKey,
  getCachedResponse,
  setCachedResponse,
} from "@/lib/cache-service";
import { ONYX_COMPLETION_TEMPERATURE } from "@/lib/onyx/constants";

export const runtime = "nodejs";

export type ChatPostBody = {
  prompt?: string;
};

export type CachedChatPayload = {
  reply: string;
  model: string;
};

async function completeWithGroq(prompt: string): Promise<CachedChatPayload> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "Groq API anahtarı yapılandırılmadı (GROQ_API_KEY)."
    );
  }

  const model =
    process.env.GROQ_MODEL?.trim() || "llama-3.1-8b-instant";

  const res = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: ONYX_COMPLETION_TEMPERATURE,
        max_tokens: 1024,
      }),
    }
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `Groq isteği başarısız (${res.status})${detail ? `: ${detail.slice(0, 200)}` : ""}`
    );
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };

  const reply = String(json.choices?.[0]?.message?.content ?? "").trim();
  if (!reply) {
    throw new Error("Groq boş yanıt döndü.");
  }

  return { reply, model };
}

/**
 * Önbellekli sohbet API — Edge Runtime + Upstash Redis.
 * Aynı prompt tekrarlandığında LLM çağrılmaz (`x-cache-hit: true`).
 */
export async function POST(request: Request) {
  let prompt = "";

  try {
    const session = await getServerAuthSession();
    if (!session) {
      return NextResponse.json(
        { error: "Oturum gerekli", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const rateLimited = await enforceRateLimit(
      request,
      "api-chat",
      20,
      60,
      session.userId
    );
    if (rateLimited) return rateLimited;

    const body = (await request.json()) as ChatPostBody;
    prompt = String(body?.prompt ?? "").trim();
  } catch {
    return NextResponse.json(
      { error: "Geçersiz JSON gövdesi", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  if (!prompt) {
    return NextResponse.json(
      { error: "prompt gerekli", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  let cacheKey: string | null = null;

  try {
    cacheKey = await generateCacheKey(prompt);
    const cached = await getCachedResponse<CachedChatPayload>(cacheKey);
    if (cached?.reply) {
      return NextResponse.json(cached, {
        headers: { "x-cache-hit": "true" },
      });
    }
  } catch {
    // Redis / hash hatası — LLM'e devam
  }

  try {
    const payload = await completeWithGroq(prompt);

    if (cacheKey) {
      await setCachedResponse(cacheKey, payload);
    }

    return NextResponse.json(payload, {
      headers: { "x-cache-hit": "false" },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        { error: err.message, code: "UNAUTHORIZED" },
        { status: err.status }
      );
    }
    const message =
      err instanceof Error ? err.message : "Yapay zeka yanıtı alınamadı";
    return NextResponse.json(
      { error: message, code: "LLM_ERROR" },
      { status: 502 }
    );
  }
}
