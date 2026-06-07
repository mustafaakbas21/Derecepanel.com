import Groq from "groq-sdk";
import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";

import {
  normalizeOnyxAiMode,
  ONYX_MODEL_FAST,
  type OnyxAiMode,
} from "@/lib/onyx/ai-mode";
import type { OnyxChatHistoryTurn } from "@/lib/onyx/chat-history-pruning";
import { resolveOnyxGroqModelSafe } from "@/lib/onyx/resolve-groq-model";
import { buildOnyxModelMessages } from "@/lib/onyx/build-model-messages";
import {
  buildOnyxSystemContent,
  ONYX_COMPLETION_MAX_TOKENS,
  ONYX_COMPLETION_TEMPERATURE,
} from "@/lib/onyx/constants";
import { finalizeOnyxSystemPrompt } from "@/lib/onyx/language-rule";
import type { OnyxContinuationContext } from "@/lib/onyx/continuity";
import {
  extractGroqErrorStatus,
  formatGroqRateLimitMessage,
  isGroqRateLimitError,
} from "@/lib/onyx/groq-error";

export type OnyxVisionInput = {
  base64: string;
  mimeType: string;
};

export type OnyxGroqInput = {
  prompt: string;
  contextData?: unknown;
  mode?: OnyxAiMode;
  /** Haftalık Program / Net Avcısı sorgu sonrası derin analiz */
  deepSkillEngine?: boolean;
  academicSolution?: boolean;
  studentMode?: boolean;
  socraticTeacher?: boolean;
  socraticTurn?: number;
  vision?: OnyxVisionInput;
  /** Unified Onyx Engine — hazır system prompt */
  systemContentOverride?: string;
  /** Kesilen yanıtı çok turlu tamamla */
  continuation?: OnyxContinuationContext;
  /** API route tarafından seçilen Groq modeli */
  groqModel?: string;
  hasImage?: boolean;
  isDeepMode?: boolean;
  /** Son N tur — TPM optimizasyonu */
  chatHistory?: OnyxChatHistoryTurn[];
  /** Varsayılan: ONYX_COMPLETION_MAX_TOKENS */
  maxTokens?: number;
};

export type OnyxGroqResult = {
  reply: string;
  model: string;
  finishReason?: string | null;
  /** Derin mod kotası / model hatasında Hızlı modele sessiz geçiş */
  usedFallback?: boolean;
};

export type OnyxGroqErrorCode =
  | "MISSING_API_KEY"
  | "RATE_LIMIT"
  | "BAD_REQUEST"
  | "SERVER_ERROR";

export class OnyxGroqError extends Error {
  readonly code: OnyxGroqErrorCode;

  constructor(message: string, code: OnyxGroqErrorCode) {
    super(message);
    this.name = "OnyxGroqError";
    this.code = code;
  }
}

function mapGroqFailure(err: unknown): OnyxGroqError {
  const status = extractGroqErrorStatus(err);

  const apiMessage =
    err && typeof err === "object" && "message" in err
      ? String((err as { message?: string }).message)
      : "";

  if (status === 401 || status === 403) {
    return new OnyxGroqError(
      "Groq API anahtarı geçersiz veya yetkisiz. GROQ_API_KEY değerini kontrol edin.",
      "MISSING_API_KEY"
    );
  }

  if (status === 429 || status === 413) {
    return new OnyxGroqError(
      status === 413
        ? "İstek boyutu Groq limitini aştı (TPM). Kısa bir süre bekleyip tekrar deneyin veya ⚡ Hızlı modu deneyin."
        : formatGroqRateLimitMessage(apiMessage),
      "RATE_LIMIT"
    );
  }

  if (status === 400) {
    return new OnyxGroqError(
      apiMessage || "Geçersiz istek. Prompt veya model parametresini kontrol edin.",
      "BAD_REQUEST"
    );
  }

  return new OnyxGroqError(
    apiMessage || "Onyx yanıt üretirken sunucu hatası oluştu.",
    "SERVER_ERROR"
  );
}

/** Sunucu tarafı Groq tamamlama */
export async function completeOnyxWithGroq(
  input: OnyxGroqInput
): Promise<OnyxGroqResult> {
  const prompt = String(input.prompt || "").trim();
  const hasVision = Boolean(input.vision?.base64?.trim());
  const hasContinuation = Boolean(input.continuation?.partialReply?.trim());
  if (!prompt && !hasVision && !hasContinuation) {
    throw new OnyxGroqError(
      "prompt, görsel veya continuation gerekli.",
      "BAD_REQUEST"
    );
  }

  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new OnyxGroqError(
      "Groq API anahtarı yapılandırılmadı. `.env.local` dosyasına `GROQ_API_KEY` ekleyin.",
      "MISSING_API_KEY"
    );
  }

  const mode = normalizeOnyxAiMode(input.mode);
  const hasImage = Boolean(input.hasImage) || hasVision;
  const isDeepMode = Boolean(input.isDeepMode) || mode === "DEEP";

  let targetModel = resolveOnyxGroqModelSafe({
    hasImage,
    isDeepMode,
    override: input.groqModel,
  });

  const groq = new Groq({ apiKey });
  const rawSystem =
    input.systemContentOverride?.trim() ||
    buildOnyxSystemContent(input.contextData, mode, {
      deepSkillEngine: input.deepSkillEngine,
      academicSolution: input.academicSolution ?? hasVision,
      studentMode: input.studentMode,
      socraticTeacher: input.socraticTeacher,
      socraticTurn: input.socraticTurn,
    });
  const systemContent = finalizeOnyxSystemPrompt(rawSystem);

  const modelMessages = buildOnyxModelMessages({
    prompt,
    vision: input.vision,
    continuation: input.continuation,
    chatHistory: input.chatHistory,
  });

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemContent },
    ...modelMessages.map((message) => {
      if (message.role === "user" && Array.isArray(message.content)) {
        return {
          role: "user" as const,
          content: message.content.map((part) => {
            if (part.type === "text") {
              return { type: "text" as const, text: part.text };
            }
            if (part.type === "image") {
              const imageUrl =
                typeof part.image === "string"
                  ? part.image
                  : part.image instanceof URL
                    ? part.image.toString()
                    : String(part.image);
              return {
                type: "image_url" as const,
                image_url: { url: imageUrl },
              };
            }
            return { type: "text" as const, text: "" };
          }),
        } satisfies ChatCompletionMessageParam;
      }
      return message as ChatCompletionMessageParam;
    }),
  ];

  const maxTokens =
    input.maxTokens && input.maxTokens > 0
      ? input.maxTokens
      : ONYX_COMPLETION_MAX_TOKENS;

  const runCompletion = (model: string) =>
    groq.chat.completions.create({
      model,
      messages,
      temperature: ONYX_COMPLETION_TEMPERATURE,
      max_tokens: maxTokens,
    });

  const canAutoFallback = (err: unknown): boolean => {
    if (!isDeepMode || hasImage || targetModel === ONYX_MODEL_FAST) return false;
    const status = extractGroqErrorStatus(err);
    return (
      status === 429 ||
      status === 413 ||
      status === 400 ||
      status === 404 ||
      isGroqRateLimitError(err)
    );
  };

  try {
    let completion;
    let usedFallback = false;
    try {
      completion = await runCompletion(targetModel);
    } catch (firstErr) {
      if (!canAutoFallback(firstErr)) throw firstErr;
      console.info(
        `[Onyx] Auto-fallback: ${targetModel} → ${ONYX_MODEL_FAST} (kota/model)`
      );
      completion = await runCompletion(ONYX_MODEL_FAST);
      targetModel = ONYX_MODEL_FAST;
      usedFallback = true;
    }

    const choice = completion.choices[0];
    const reply =
      choice?.message?.content?.trim() ||
      "Yanıt oluşturulamadı. Lütfen tekrar deneyin.";

    return {
      reply,
      model: completion.model || targetModel,
      finishReason: choice?.finish_reason ?? null,
      usedFallback,
    };
  } catch (err) {
    if (err instanceof OnyxGroqError) throw err;
    throw mapGroqFailure(err);
  }
}
