import "server-only";

import { createGroq } from "@ai-sdk/groq";
import type { ModelMessage } from "ai";
import { streamText } from "ai";

import { resolveChatSession, persistChatExchange } from "@/lib/db/chat-memory";
import {
  ONYX_COMPLETION_MAX_TOKENS,
  ONYX_COMPLETION_TEMPERATURE,
} from "@/lib/onyx/constants";
import { detectOnyxReplyContinuity } from "@/lib/onyx/continuity";
import {
  ONYX_MODEL_DEEP,
  ONYX_MODEL_FAST,
  ONYX_MODEL_VISION,
} from "@/lib/onyx/groq-models";
import { OnyxGroqError } from "@/lib/onyx/groq-server";
import { resolveOnyxGroqModelSafe } from "@/lib/onyx/resolve-groq-model";
import {
  ONYX_STREAM_BUSY_MESSAGE,
  ONYX_STREAM_ERROR_PREFIX,
  ONYX_STREAM_META_PREFIX,
  type OnyxStreamMessageMetadata,
} from "@/lib/onyx/stream-protocol";
import {
  extractGroqErrorStatus,
  formatGroqRateLimitMessage,
  isGroqRateLimitError,
} from "@/lib/onyx/groq-error";
import { shrinkOnyxStreamPrep } from "@/lib/onyx/prompt-budget";
import type { OnyxStreamPrepareResult } from "@/lib/onyx-engine";

export {
  ONYX_STREAM_BUSY_MESSAGE,
  ONYX_STREAM_ERROR_PREFIX,
  ONYX_STREAM_META_PREFIX,
  splitOnyxStreamPayload,
  type OnyxStreamMessageMetadata,
} from "@/lib/onyx/stream-protocol";

function mapStreamFailure(err: unknown): OnyxGroqError {
  const status = extractGroqErrorStatus(err);

  const message =
    err && typeof err === "object" && "message" in err
      ? String((err as { message?: string }).message)
      : "Onyx akış yanıtı başarısız.";

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
        : formatGroqRateLimitMessage(message),
      "RATE_LIMIT"
    );
  }

  if (status === 400) {
    return new OnyxGroqError(message, "BAD_REQUEST");
  }

  return new OnyxGroqError(message, "SERVER_ERROR");
}

function isRetryableStreamError(err: unknown): boolean {
  const status = extractGroqErrorStatus(err);

  if (status === 429 || status === 413) return true;
  if (status === 400 || status === 404 || status === 422) return true;
  if (isGroqRateLimitError(err)) return true;
  if (err instanceof Error && err.message === "EMPTY_STREAM") return true;
  return false;
}

/** Groq resmi aktif modeller — vision: Scout, deep: 70b, fast: 8b instant */
export function resolveOnyxStreamModelId(
  prep: Extract<OnyxStreamPrepareResult, { kind: "stream" }>
): string {
  const override = prep.groqModel?.trim();
  return resolveOnyxGroqModelSafe({
    hasImage: prep.hasImage,
    isDeepMode: prep.isDeepMode,
    override: override || undefined,
  });
}

function buildModelFallbackChain(
  prep: Extract<OnyxStreamPrepareResult, { kind: "stream" }>,
  primary: string
): string[] {
  const chain = [primary];

  if (!prep.hasImage && primary !== ONYX_MODEL_FAST) {
    chain.push(ONYX_MODEL_FAST);
  }

  return [...new Set(chain)];
}

type OpenStreamResult = {
  result: ReturnType<typeof streamText>;
  firstChunk: string;
  iterator: AsyncIterator<string>;
};

async function openGroqTextStream(
  prep: Extract<OnyxStreamPrepareResult, { kind: "stream" }>,
  groq: ReturnType<typeof createGroq>,
  modelId: string,
  resolvedSessionId: string | undefined,
  streamMetaRef: { current?: OnyxStreamMessageMetadata },
  options?: { maxRetries?: number }
): Promise<OpenStreamResult> {
  let streamError: unknown;

  const result = streamText({
    model: groq(modelId),
    system: prep.system,
    messages: prep.messages as ModelMessage[],
    temperature: ONYX_COMPLETION_TEMPERATURE,
    maxOutputTokens: ONYX_COMPLETION_MAX_TOKENS,
    maxRetries: options?.maxRetries ?? 1,
    onError: ({ error }) => {
      streamError = error;
      console.error("[Onyx streamText] Groq akış hatası:", error);
    },
    onFinish: async ({ text, finishReason, response }) => {
      const continuity = detectOnyxReplyContinuity(finishReason);
      const streamMeta: OnyxStreamMessageMetadata = {
        sessionId: resolvedSessionId,
        model: response.modelId || modelId,
        socraticPhase: prep.meta.socraticPhase,
        socraticTurn: prep.meta.socraticTurn,
        activeSkills: prep.meta.activeSkills,
        finishReason,
        finished: continuity.finished,
        truncated: continuity.truncated,
      };

      const persistedText = text.trim() || ONYX_STREAM_BUSY_MESSAGE;

      if (prep.persist.studentId) {
        const saved = await persistChatExchange({
          studentId: prep.persist.studentId,
          sessionId: resolvedSessionId,
          userContent: prep.persist.userContent,
          onyxContent: persistedText,
        });
        streamMeta.sessionId = saved.sessionId;
      }

      streamMetaRef.current = streamMeta;
    },
  });

  const iterator = result.textStream[Symbol.asyncIterator]();
  const first = await iterator.next();

  if (streamError) throw streamError;

  if (first.done && !first.value?.trim()) {
    throw new Error("EMPTY_STREAM");
  }

  return {
    result,
    firstChunk: first.value ?? "",
    iterator,
  };
}

function buildLiveStreamResponse(
  prep: Extract<OnyxStreamPrepareResult, { kind: "stream" }>,
  open: OpenStreamResult,
  modelId: string,
  resolvedSessionId: string | undefined,
  streamMetaRef: { current?: OnyxStreamMessageMetadata },
  streamUsedFallback: boolean
): Response {
  const encoder = new TextEncoder();
  let hasContent = false;

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        if (open.firstChunk) {
          hasContent = true;
          controller.enqueue(encoder.encode(open.firstChunk));
        }

        while (true) {
          const next = await open.iterator.next();
          if (next.done) break;
          if (next.value) {
            hasContent = true;
            controller.enqueue(encoder.encode(next.value));
          }
        }

        const finalText = (await open.result.text) || "";
        if (!finalText.trim()) {
          const fallback = ONYX_STREAM_BUSY_MESSAGE;
          if (!hasContent) {
            controller.enqueue(encoder.encode(fallback));
            hasContent = true;
          }
          streamMetaRef.current = {
            ...(streamMetaRef.current ?? {
              sessionId: resolvedSessionId,
              socraticPhase: prep.meta.socraticPhase,
              socraticTurn: prep.meta.socraticTurn,
              activeSkills: prep.meta.activeSkills,
            }),
            model: modelId,
            error: fallback,
          };
        }

        const meta: OnyxStreamMessageMetadata = {
          ...(streamMetaRef.current ?? {
            sessionId: resolvedSessionId,
            socraticPhase: prep.meta.socraticPhase,
            socraticTurn: prep.meta.socraticTurn,
            activeSkills: prep.meta.activeSkills,
            model: modelId,
          }),
          model: streamMetaRef.current?.model ?? modelId,
          usedFallback: streamUsedFallback || streamMetaRef.current?.usedFallback,
        };

        controller.enqueue(
          encoder.encode(`${ONYX_STREAM_META_PREFIX}${JSON.stringify(meta)}`)
        );
        controller.close();
      } catch (err) {
        console.error("[Onyx] Groq canlı akış hatası:", err);
        const mapped = mapStreamFailure(err);
        if (!hasContent) {
          const userError =
            mapped.code === "RATE_LIMIT"
              ? mapped.message
              : ONYX_STREAM_BUSY_MESSAGE;
          controller.enqueue(
            encoder.encode(
              `${ONYX_STREAM_ERROR_PREFIX}${JSON.stringify({
                error: userError,
                code: mapped.code,
                detail: mapped.message,
              })}`
            )
          );
          controller.close();
          return;
        }
        controller.error(mapped);
      }
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Onyx-Stream": "1",
      "X-Onyx-Session-Id": resolvedSessionId ?? "",
      "X-Onyx-Model": modelId,
    },
  });
}

export async function runOnyxStreamResponse(
  prep: Extract<OnyxStreamPrepareResult, { kind: "stream" }>
): Promise<Response> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new OnyxGroqError(
      "Groq API anahtarı yapılandırılmadı. `.env.local` dosyasına `GROQ_API_KEY` ekleyin.",
      "MISSING_API_KEY"
    );
  }

  const groq = createGroq({ apiKey });
  const primaryModel = resolveOnyxStreamModelId(prep);
  const modelChain = buildModelFallbackChain(prep, primaryModel);

  let resolvedSessionId = prep.persist.sessionId;
  if (prep.persist.studentId && !resolvedSessionId) {
    resolvedSessionId = await resolveChatSession(
      prep.persist.studentId,
      prep.persist.sessionId
    );
  }

  const streamMetaRef: { current?: OnyxStreamMessageMetadata } = {};
  let lastError: unknown;

  const shrinkLevels: Array<0 | 1 | 2> = [0, 1, 2];

  for (let i = 0; i < modelChain.length; i++) {
    const modelId = modelChain[i]!;
    const streamUsedFallback = i > 0;
    const hasModelFallback = i < modelChain.length - 1;

    for (const shrinkLevel of shrinkLevels) {
      const prepAttempt =
        shrinkLevel === 0 ? prep : shrinkOnyxStreamPrep(prep, shrinkLevel);

      try {
        if (i > 0 && shrinkLevel === 0) {
          console.info(
            `[Onyx] Model yedeklemesi: ${modelChain[i - 1]} → ${modelId}`
          );
        }
        if (shrinkLevel > 0) {
          console.info(
            `[Onyx] TPM küçültme seviye=${shrinkLevel} model=${modelId}`
          );
        }
        console.info(
          `[Onyx] streamText model=${modelId} vision=${prep.hasImage} deep=${prep.isDeepMode} shrink=${shrinkLevel}`
        );

        const open = await openGroqTextStream(
          prepAttempt,
          groq,
          modelId,
          resolvedSessionId,
          streamMetaRef,
          { maxRetries: hasModelFallback && shrinkLevel === 0 ? 0 : 1 }
        );
        return buildLiveStreamResponse(
          prepAttempt,
          open,
          modelId,
          resolvedSessionId,
          streamMetaRef,
          streamUsedFallback
        );
      } catch (err) {
        lastError = err;
        console.error(
          `[Onyx] Groq API hatası (model=${modelId}, shrink=${shrinkLevel}):`,
          err
        );

        const isTpm =
          extractGroqErrorStatus(err) === 413 ||
          extractGroqErrorStatus(err) === 429;

        if (isTpm && shrinkLevel < 2) continue;

        if (!hasModelFallback || !isRetryableStreamError(err)) break;
        break;
      }
    }
  }

  throw mapStreamFailure(lastError ?? new Error("Groq stream başlatılamadı"));
}

/** route.ts — akış başlamadan çöken hatalar için JSON yanıt */
export function onyxStreamErrorResponse(err: unknown): Response {
  const mapped =
    err instanceof OnyxGroqError ? err : mapStreamFailure(err);

  console.error("Groq API Hatası:", mapped);

  const httpStatus =
    mapped.code === "MISSING_API_KEY"
      ? 503
      : mapped.code === "RATE_LIMIT"
        ? 429
        : mapped.code === "BAD_REQUEST"
          ? 400
          : 500;

  const userMessage =
    mapped.code === "RATE_LIMIT" || mapped.code === "MISSING_API_KEY"
      ? mapped.message
      : ONYX_STREAM_BUSY_MESSAGE;

  return Response.json(
    { error: userMessage, code: mapped.code, detail: mapped.message },
    { status: httpStatus }
  );
}

export { ONYX_MODEL_FAST, ONYX_MODEL_DEEP, ONYX_MODEL_VISION };
