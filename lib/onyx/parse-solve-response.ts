import {
  deepDiagnosisToSolveStructured,
  parseDeepErrorDiagnosisFromText,
} from "@/lib/onyx/deep-error-diagnosis";
import { stripOnyxThinkingBlocks } from "@/lib/onyx/solve-accuracy-protocol";
import { clampZorluk, type OnyxSolveStructured } from "@/lib/onyx/solve-types";
import type { OnyxRole } from "@/lib/onyx/role-quick-prompts";

function tryParseObject(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function coerceSolve(obj: Record<string, unknown>): OnyxSolveStructured | null {
  const cozum = String(obj.cozum ?? "").trim();
  const konu_basligi = String(
    obj.konu_basligi ?? obj.konuBasligi ?? obj.konu ?? ""
  ).trim();
  if (!cozum || !konu_basligi) return null;

  return {
    cozum,
    konu_basligi,
    zorluk_seviyesi: clampZorluk(obj.zorluk_seviyesi ?? obj.zorluk),
    hata_kodu: String(obj.hata_kodu ?? obj.hataKodu ?? "BILINMIYOR").trim(),
    coach_insight: String(obj.coach_insight ?? obj.coachInsight ?? "").trim() || undefined,
  };
}

/** Model çıktısından JSON soru çözüm yapısını çıkarır */
export function parseSolveJsonFromText(
  text: string,
  role?: OnyxRole
): OnyxSolveStructured | null {
  const deep = parseDeepErrorDiagnosisFromText(text);
  if (deep) return deepDiagnosisToSolveStructured(deep, role);

  const trimmed = stripOnyxThinkingBlocks(text);
  if (!trimmed) return null;

  const fenced =
    trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] ??
    trimmed.match(/\{[\s\S]*\}/)?.[0];
  const candidate = fenced?.trim() ?? trimmed;

  const direct = tryParseObject(candidate);
  if (direct && typeof direct === "object" && !Array.isArray(direct)) {
    const solved = coerceSolve(direct as Record<string, unknown>);
    if (solved) return solved;
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    const slice = trimmed.slice(start, end + 1);
    const inner = tryParseObject(slice);
    if (inner && typeof inner === "object" && !Array.isArray(inner)) {
      return coerceSolve(inner as Record<string, unknown>);
    }
  }

  return null;
}
