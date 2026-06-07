/** Onyx SSE/text stream protokolü — istemci ve sunucu tarafında paylaşılır (Node API yok). */

export const ONYX_STREAM_META_PREFIX = "\u001eONYX_META\u001e";
export const ONYX_STREAM_ERROR_PREFIX = "\u001eONYX_ERROR\u001e";

export const ONYX_STREAM_BUSY_MESSAGE =
  "Yapay zeka motorunda anlık bir yoğunluk var. Lütfen soruyu tekrar gönder.";

export type OnyxStreamMessageMetadata = {
  sessionId?: string;
  model?: string;
  socraticPhase?: "probe" | "reveal";
  socraticTurn?: number;
  activeSkills?: string[];
  finishReason?: string | null;
  finished?: boolean;
  truncated?: boolean;
  /** Derin mod kotasında Hızlı modele sessiz geçiş */
  usedFallback?: boolean;
  error?: string;
};

export function splitOnyxStreamPayload(raw: string): {
  reply: string;
  meta: OnyxStreamMessageMetadata;
  streamError?: string;
} {
  const errorIdx = raw.indexOf(ONYX_STREAM_ERROR_PREFIX);
  if (errorIdx !== -1) {
    const errJson = raw.slice(errorIdx + ONYX_STREAM_ERROR_PREFIX.length);
    try {
      const parsed = JSON.parse(errJson) as { error?: string };
      return {
        reply: "",
        meta: {},
        streamError: parsed.error ?? ONYX_STREAM_BUSY_MESSAGE,
      };
    } catch {
      return { reply: "", meta: {}, streamError: ONYX_STREAM_BUSY_MESSAGE };
    }
  }

  const idx = raw.lastIndexOf(ONYX_STREAM_META_PREFIX);
  if (idx === -1) {
    return { reply: raw, meta: {} };
  }

  const reply = raw.slice(0, idx);
  const metaJson = raw.slice(idx + ONYX_STREAM_META_PREFIX.length);
  try {
    const meta = JSON.parse(metaJson) as OnyxStreamMessageMetadata;
    return {
      reply,
      meta,
      streamError: meta.error,
    };
  } catch {
    return { reply, meta: {} };
  }
}
