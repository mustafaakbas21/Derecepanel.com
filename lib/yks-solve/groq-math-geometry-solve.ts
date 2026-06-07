import "server-only";

import Groq from "groq-sdk";

import { ONYX_COMPLETION_TEMPERATURE } from "@/lib/onyx/constants";
import {
  extractGroqErrorStatus,
  isGroqRateLimitError,
} from "@/lib/onyx/groq-error";
import {
  ONYX_MODEL_DEEP,
  resolveLegacyGroqModel,
} from "@/lib/onyx/groq-models";

/** llama3-70b-8192 Groq'ta kaldırıldı → güncel eşdeğer */
export const YKS_MATH_GEOMETRY_SOLVE_MODEL =
  resolveLegacyGroqModel("llama3-70b-8192") ?? ONYX_MODEL_DEEP;

export const YKS_MATH_GEOMETRY_SOLVE_BUSY_MESSAGE =
  "Hocamız şu an sorunu inceliyor, birazdan tekrar dene.";

export const YKS_MATH_GEOMETRY_SYSTEM_PROMPT = `Sen Türkiye'nin en tecrübeli YKS (TYT/AYT) Matematik öğretmenisin. Görevin, sana gelen soruları bir öğrenciye tahtada anlatır gibi adım adım çözmektir.

Yalnızca Türkçe konuş. Formülleri $...$ veya $$...$$ ile yaz. İngilizce başlık kullanma.

KURALLAR:
1. Asla tahmin etme. Eğer soruda eksik veri varsa veya grafiği göremiyorsan, "Bu soruda eksik veri var" de.
2. Çözüme doğrudan "Cevap A" diyerek başlama.
3. Önce soruda verilen bilgileri listele.
4. Kullanılacak formülü veya matematiksel kuralı belirt.
5. İşlemleri adım adım yap (**1. Adım**, **2. Adım** …); ara işlemleri atlama, kafadan hesap yapma.
6. Sonucu bulduktan sonra, "ÖSYM bu konudan tuzak sorabilir, şuna dikkat et" şeklinde ufak bir taktik ver.

Yanıt sırası (atlamadan):
- Verilenler
- Formül / kural
- Adım adım çözüm
- Nihai cevap veya doğru şık (en sonda)
- ÖSYM taktik uyarısı`;

export type YksGroqSolveErrorCode =
  | "BAD_REQUEST"
  | "MISSING_API_KEY"
  | "RATE_LIMIT"
  | "TIMEOUT"
  | "SERVER_ERROR";

export type YksGroqSolveResult =
  | {
      ok: true;
      reply: string;
      model: string;
    }
  | {
      ok: false;
      message: string;
      code: YksGroqSolveErrorCode;
    };

export type SolveYksMathGeometryQuestionOptions = {
  /** Varsayılan 45 sn */
  timeoutMs?: number;
  /** Groq model override — varsayılan llama3-70b-8192 alias */
  model?: string;
};

function isTimeoutError(err: unknown): boolean {
  if (err == null) return false;
  const message = err instanceof Error ? err.message : String(err);
  return (
    /timeout|timed out|ETIMEDOUT|ECONNABORTED|AbortError|aborted/i.test(
      message
    ) ||
    (typeof err === "object" &&
      err !== null &&
      (err as { name?: string }).name === "AbortError")
  );
}

function getGroqClient(timeoutMs: number): Groq | null {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) return null;
  return new Groq({ apiKey, timeout: timeoutMs });
}

async function callGroqSolve(
  groq: Groq,
  model: string,
  questionText: string,
  timeoutMs: number
): Promise<{ reply: string; model: string }> {
  const completionPromise = groq.chat.completions.create({
    model,
    messages: [
      { role: "system", content: YKS_MATH_GEOMETRY_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Aşağıdaki YKS Matematik veya Geometri sorusunu protokole uyarak çöz:\n\n${questionText}`,
      },
    ],
    temperature: ONYX_COMPLETION_TEMPERATURE,
    max_tokens: 2048,
  });

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error("Groq isteği zaman aşımına uğradı."));
    }, timeoutMs);
  });

  try {
    const completion = await Promise.race([completionPromise, timeoutPromise]);
    const reply =
      completion.choices[0]?.message?.content?.trim() ||
      "Yanıt oluşturulamadı.";
    return { reply, model: completion.model || model };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Groq ile YKS Matematik / Geometri metin sorusu çözümü.
 * Model: llama3-70b-8192 (Groq alias → llama-3.3-70b-versatile).
 */
export async function solveYksMathGeometryQuestion(
  questionText: string,
  options?: SolveYksMathGeometryQuestionOptions
): Promise<YksGroqSolveResult> {
  const prompt = String(questionText ?? "").trim();
  if (!prompt) {
    return {
      ok: false,
      message: "Soru metni boş olamaz.",
      code: "BAD_REQUEST",
    };
  }

  const timeoutMs = Math.max(5_000, options?.timeoutMs ?? 45_000);
  const model = String(options?.model ?? YKS_MATH_GEOMETRY_SOLVE_MODEL).trim();

  const groq = getGroqClient(timeoutMs);
  if (!groq) {
    return {
      ok: false,
      message: YKS_MATH_GEOMETRY_SOLVE_BUSY_MESSAGE,
      code: "MISSING_API_KEY",
    };
  }

  try {
    const result = await callGroqSolve(groq, model, prompt, timeoutMs);
    return { ok: true, reply: result.reply, model: result.model };
  } catch (err) {
    if (isTimeoutError(err)) {
      return {
        ok: false,
        message: YKS_MATH_GEOMETRY_SOLVE_BUSY_MESSAGE,
        code: "TIMEOUT",
      };
    }

    const status = extractGroqErrorStatus(err);
    if (
      isGroqRateLimitError(err) ||
      status === 429 ||
      status === 413 ||
      status === 503
    ) {
      return {
        ok: false,
        message: YKS_MATH_GEOMETRY_SOLVE_BUSY_MESSAGE,
        code: "RATE_LIMIT",
      };
    }

    console.error("[YKS Groq Solve]", err);
    return {
      ok: false,
      message: YKS_MATH_GEOMETRY_SOLVE_BUSY_MESSAGE,
      code: "SERVER_ERROR",
    };
  }
}
