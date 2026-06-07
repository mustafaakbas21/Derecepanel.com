import "server-only";

import { createGroq } from "@ai-sdk/groq";
import { generateObject, generateText } from "ai";
import type { z } from "zod";

import {
  ONYX_COMPLETION_MAX_TOKENS,
  ONYX_COMPLETION_TEMPERATURE,
  ONYX_SKILL_COMPLETION_MAX_TOKENS,
} from "@/lib/onyx/constants";
import { OnyxGroqError } from "@/lib/onyx/groq-server";
import {
  extractGroqErrorStatus,
  formatGroqRateLimitMessage,
  isGroqRateLimitError,
} from "@/lib/onyx/groq-error";
import {
  ONYX_MODEL_STRUCTURED,
  ONYX_MODEL_STRUCTURED_DEEP,
} from "@/lib/onyx/groq-models";
import {
  ONYX_SKILL_SYSTEM_MAX_CHARS,
  truncateOnyxText,
} from "@/lib/onyx/prompt-budget";
import {
  ONYX_YOUTUBE_PROMPT_MAX_CHARS,
  shrinkYoutubeAiPrompt,
  YOUTUBE_PROMPT_RAG_MARKER,
} from "@/lib/onyx/youtube-transcript-server";
import { parseSkillResponseFromText } from "@/lib/onyx/skill-adapters";
import { preprocessCareerCounseling } from "@/lib/onyx/career-counseling-coerce";
import {
  ensureStrategyMinimums,
  preprocessStrategySkillEnvelope,
} from "@/lib/onyx/strategy-skill-coerce";
import {
  resolveOnyxGroqModelSafe,
  resolveOnyxStructuredGroqModel,
} from "@/lib/onyx/resolve-groq-model";

function mapGenerateObjectFailure(err: unknown): OnyxGroqError {
  const status = extractGroqErrorStatus(err);
  const message =
    err && typeof err === "object" && "message" in err
      ? String((err as { message?: string }).message)
      : "Yapılandırılmış yanıt üretilemedi.";

  if (status === 401 || status === 403) {
    return new OnyxGroqError(
      "Groq API anahtarı geçersiz veya yetkisiz. GROQ_API_KEY değerini kontrol edin.",
      "MISSING_API_KEY"
    );
  }
  if (status === 429 || status === 413) {
    return new OnyxGroqError(
      status === 413
        ? "İstek boyutu Groq limitini aştı (TPM). Birkaç saniye bekleyip tekrar deneyin."
        : formatGroqRateLimitMessage(message),
      "RATE_LIMIT"
    );
  }
  if (status === 400) {
    return new OnyxGroqError(
      message || "Şema doğrulaması başarısız — model geçersiz alan üretti.",
      "BAD_REQUEST"
    );
  }
  return new OnyxGroqError(message, "SERVER_ERROR");
}

function getGroqProvider() {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new OnyxGroqError(
      "Groq API anahtarı yapılandırılmadı. `.env.local` dosyasına `GROQ_API_KEY` ekleyin.",
      "MISSING_API_KEY"
    );
  }
  return createGroq({ apiKey });
}

function isJsonSchemaUnsupportedError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err ?? "");
  return /does not support response format.*json_schema/i.test(message);
}

function isTpmOrRateLimitError(err: unknown): boolean {
  const status = extractGroqErrorStatus(err);
  return (
    status === 413 ||
    status === 429 ||
    isGroqRateLimitError(err) ||
    /TPM|too large|request too large/i.test(
      err instanceof Error ? err.message : String(err ?? "")
    )
  );
}

function canRetryStructuredObject(err: unknown): boolean {
  const status = extractGroqErrorStatus(err);
  return (
    status === 400 ||
    status === 429 ||
    status === 413 ||
    isJsonSchemaUnsupportedError(err) ||
    isGroqRateLimitError(err)
  );
}

function extractJsonCandidate(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  if (fenced?.trim()) return fenced.trim();

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);

  return trimmed;
}

function buildStructuredModelChain(isDeepMode: boolean): string[] {
  const primary = resolveOnyxStructuredGroqModel({ isDeepMode });
  const chain = [primary];
  if (isDeepMode && primary !== ONYX_MODEL_STRUCTURED_DEEP) {
    chain.push(ONYX_MODEL_STRUCTURED_DEEP);
  }
  if (primary !== ONYX_MODEL_STRUCTURED) {
    chain.push(ONYX_MODEL_STRUCTURED);
  }
  return [...new Set(chain)];
}

type ObjectAttempt = {
  system: string;
  prompt: string;
  maxOutputTokens: number;
  models: string[];
};

export type GenerateOnyxObjectInput<T> = {
  schema: z.ZodType<T>;
  system: string;
  prompt: string;
  isDeepMode?: boolean;
  hasImage?: boolean;
  groqModel?: string;
  maxTokens?: number;
};

/** Zod strict şema + generateObject — halüsinasyon / sahte key koruması */
export async function generateOnyxObject<T>(
  input: GenerateOnyxObjectInput<T>
): Promise<{ object: T; model: string; usedFallback?: boolean }> {
  const prompt = String(input.prompt ?? "").trim();
  if (!prompt) {
    throw new OnyxGroqError("prompt boş olamaz.", "BAD_REQUEST");
  }

  const groq = getGroqProvider();
  const isDeepMode = Boolean(input.isDeepMode);
  const hasImage = Boolean(input.hasImage);

  const baseMaxOutputTokens =
    input.maxTokens && input.maxTokens > 0
      ? input.maxTokens
      : ONYX_COMPLETION_MAX_TOKENS;

  const models = buildStructuredModelChain(isDeepMode);
  if (input.groqModel?.trim()) {
    const override = resolveOnyxStructuredGroqModel({
      hasImage,
      isDeepMode,
      override: input.groqModel,
    });
    if (!models.includes(override)) models.unshift(override);
  }

  const shrinkPromptForAttempt = (userPrompt: string, max: number) =>
    userPrompt.includes(YOUTUBE_PROMPT_RAG_MARKER)
      ? shrinkYoutubeAiPrompt(userPrompt, max)
      : truncateOnyxText(userPrompt, max);

  const attempts: ObjectAttempt[] = [
    {
      system: input.system,
      prompt,
      maxOutputTokens: baseMaxOutputTokens,
      models,
    },
    {
      system: truncateOnyxText(input.system, ONYX_SKILL_SYSTEM_MAX_CHARS),
      prompt: shrinkPromptForAttempt(prompt, 12_000),
      maxOutputTokens: Math.min(baseMaxOutputTokens, 1536),
      models: [ONYX_MODEL_STRUCTURED],
    },
    {
      system: truncateOnyxText(input.system, 4500),
      prompt: shrinkPromptForAttempt(
        prompt,
        Math.floor(ONYX_YOUTUBE_PROMPT_MAX_CHARS * 0.55)
      ),
      maxOutputTokens: 1024,
      models: [ONYX_MODEL_STRUCTURED],
    },
  ];

  const runObject = async (
    modelId: string,
    system: string,
    userPrompt: string,
    maxOutputTokens: number
  ) =>
    generateObject({
      model: groq(modelId),
      schema: input.schema,
      system,
      prompt: userPrompt,
      temperature: ONYX_COMPLETION_TEMPERATURE,
      maxOutputTokens,
      maxRetries: 1,
    });

  const runTextJsonFallback = async (
    system: string,
    userPrompt: string,
    maxOutputTokens: number
  ): Promise<{ object: T; model: string }> => {
    const textModel = resolveOnyxGroqModelSafe({
      hasImage,
      isDeepMode: false,
      override: input.groqModel,
    });
    const compactSystem = truncateOnyxText(system, 4500);
    const jsonSystem = `${compactSystem}

Yanıtın yalnızca geçerli bir JSON nesnesi olmalı. Markdown, kod bloğu veya açıklama ekleme.`;

    const { text } = await generateText({
      model: groq(textModel),
      system: jsonSystem,
      prompt: userPrompt,
      temperature: ONYX_COMPLETION_TEMPERATURE,
      maxOutputTokens,
      maxRetries: 1,
    });

    const candidate = extractJsonCandidate(text);
    if (!candidate) {
      throw new OnyxGroqError(
        "Model geçerli JSON döndürmedi.",
        "BAD_REQUEST"
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(candidate);
    } catch {
      throw new OnyxGroqError(
        "Model geçerli JSON döndürmedi.",
        "BAD_REQUEST"
      );
    }

    const preprocessed = preprocessStrategySkillEnvelope(parsed);
    const validated = input.schema.safeParse(preprocessed ?? parsed);
    if (validated.success) {
      let object = validated.data;
      if (
        object &&
        typeof object === "object" &&
        "type" in object &&
        (object as { type?: string }).type === "strategy" &&
        "data" in object
      ) {
        const wrapped = object as {
          type: "strategy";
          data: Parameters<typeof ensureStrategyMinimums>[0];
        };
        object = {
          ...wrapped,
          data: ensureStrategyMinimums(wrapped.data),
        } as T;
      }
      return { object, model: textModel };
    }

    const careerCandidate = preprocessCareerCounseling(parsed);
    const careerValidated = input.schema.safeParse(careerCandidate);
    if (careerValidated.success) {
      return { object: careerValidated.data, model: textModel };
    }

    const loose = parseSkillResponseFromText(
      typeof preprocessed === "object" && preprocessed
        ? JSON.stringify(preprocessed)
        : candidate
    );
    if (loose) {
      const object =
        loose.type === "strategy"
          ? ({
              type: "strategy" as const,
              data: ensureStrategyMinimums(loose.data),
            } as T)
          : (loose as T);
      return { object, model: textModel };
    }

    throw new OnyxGroqError(
      "JSON şema doğrulaması başarısız — model geçersiz alan üretti.",
      "BAD_REQUEST"
    );
  };

  try {
    let lastErr: unknown;
    let usedFallback = false;

    for (let attemptIdx = 0; attemptIdx < attempts.length; attemptIdx++) {
      const attempt = attempts[attemptIdx]!;
      if (attemptIdx > 0) {
        console.info(
          `[Onyx] Structured TPM küçültme seviye=${attemptIdx} maxTok=${attempt.maxOutputTokens}`
        );
        usedFallback = true;
      }

      for (let modelIdx = 0; modelIdx < attempt.models.length; modelIdx++) {
        const modelId = attempt.models[modelIdx]!;
        try {
          const result = await runObject(
            modelId,
            attempt.system,
            attempt.prompt,
            attempt.maxOutputTokens
          );
          const revalidated = input.schema.safeParse(result.object);
          const object = revalidated.success ? revalidated.data : result.object;
          return {
            object,
            model: result.response.modelId || modelId,
            usedFallback: usedFallback || attemptIdx > 0 || modelIdx > 0,
          };
        } catch (err) {
          lastErr = err;
          if (!canRetryStructuredObject(err)) throw err;
          if (isTpmOrRateLimitError(err) && attemptIdx < attempts.length - 1) {
            break;
          }
          console.info(
            `[Onyx] Structured output fallback: ${modelId} → next model`
          );
        }
      }
    }

    console.info("[Onyx] Structured output → metin + JSON parse fallback");
    const textResult = await runTextJsonFallback(
      attempts[attempts.length - 1]!.system,
      attempts[attempts.length - 1]!.prompt,
      1024
    );
    return { ...textResult, usedFallback: true };
  } catch (err) {
    if (err instanceof OnyxGroqError) throw err;
    throw mapGenerateObjectFailure(err);
  }
}

export { ONYX_SKILL_COMPLETION_MAX_TOKENS };
