import type { ModelMessage } from "ai";

import { ONYX_COMPRESSED_SYSTEM_CORE } from "@/lib/onyx/compressed-system-prompt";
import type { OnyxStreamPrepareResult } from "@/lib/onyx-engine";
import {
  ONYX_ABSOLUTE_LANGUAGE_OVERRIDE,
  ONYX_TURKISH_LANGUAGE_RULE,
} from "@/lib/onyx/language-rule";

/** Groq TPM — öğrenci bağlamı üst sınırı */
export const ONYX_STREAM_CONTEXT_MAX_CHARS = 2200;

/** Strateji skill — Atlas + panel özeti üst sınırı */
export const ONYX_STRATEGY_CONTEXT_MAX_CHARS = 3200;

/** generateObject system prompt — TPM aşımında kırpma */
export const ONYX_SKILL_SYSTEM_MAX_CHARS = 9000;

/** Geçmiş tur — tek mesaj üst sınırı */
export const ONYX_CHAT_TURN_MAX_CHARS = 700;

const INTENT_MARKERS = [
  "[OTONOM NİYET OKUMA",
  "[NİYET MOTORU — GİZLİ]",
] as const;

export function truncateOnyxText(text: string, max: number): string {
  const t = String(text || "").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

function truncateMessageContent(
  content: ModelMessage["content"],
  max: number
): ModelMessage["content"] {
  if (typeof content === "string") {
    return truncateOnyxText(content, max);
  }
  if (!Array.isArray(content)) return content;
  return content.map((part) => {
    if (part.type === "text" && "text" in part) {
      return {
        ...part,
        text: truncateOnyxText(String(part.text), max),
      };
    }
    return part;
  }) as ModelMessage["content"];
}

function stripIntentBlock(system: string): string {
  let earliest = -1;
  for (const marker of INTENT_MARKERS) {
    const idx = system.indexOf(marker);
    if (idx >= 0 && (earliest < 0 || idx < earliest)) earliest = idx;
  }
  if (earliest < 0) return system.trim();
  return system.slice(0, earliest).trim();
}

function extractStudentDataBlock(system: string): string {
  const marker = "[ÖĞRENCİ VERİSİ]:";
  const idx = system.indexOf(marker);
  if (idx < 0) return "";
  return system.slice(idx + marker.length).trim();
}

function buildMinimalOnyxSystem(fullSystem: string): string {
  const studentData = extractStudentDataBlock(fullSystem);
  const studentBlock = studentData
    ? `\n\n[ÖĞRENCİ VERİSİ]:\n${truncateOnyxText(studentData, ONYX_STREAM_CONTEXT_MAX_CHARS)}\n\nVeriyi yorumla; sadece listeleme.`
    : "";

  return `${ONYX_TURKISH_LANGUAGE_RULE}

${ONYX_COMPRESSED_SYSTEM_CORE}
${studentBlock}

${ONYX_ABSOLUTE_LANGUAGE_OVERRIDE}`;
}

/** 413/429 — isteği küçült (0 = dokunma) */
export function shrinkOnyxStreamPrep(
  prep: Extract<OnyxStreamPrepareResult, { kind: "stream" }>,
  level: 1 | 2
): Extract<OnyxStreamPrepareResult, { kind: "stream" }> {
  const turnMax = level === 1 ? ONYX_CHAT_TURN_MAX_CHARS : 400;
  const historyKeep = level === 1 ? 3 : 1;

  const messages = prep.messages
    .map((m) => ({
      ...m,
      content: truncateMessageContent(m.content, turnMax),
    }))
    .slice(-historyKeep) as ModelMessage[];

  if (level === 1) {
    const system = truncateOnyxText(stripIntentBlock(prep.system), 12_000);
    return { ...prep, system, messages };
  }

  return {
    ...prep,
    system: buildMinimalOnyxSystem(prep.system),
    messages,
  };
}
