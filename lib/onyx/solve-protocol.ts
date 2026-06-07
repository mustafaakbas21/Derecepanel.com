/** Soru çözme — legacy JSON şeması ve geriye dönük re-exportlar */

import { buildVisionAcademicProtocolBlock } from "@/lib/onyx/vision-academic-protocol";
import { finalizeOnyxSystemPrompt } from "@/lib/onyx/language-rule";
import type { OnyxRole } from "@/lib/onyx/role-quick-prompts";

export {
  buildVisionAcademicProtocolBlock,
  ONYX_VISION_ACADEMIC_PROTOCOL,
} from "@/lib/onyx/vision-academic-protocol";

export type { OnyxSolveStructured } from "@/lib/onyx/solve-types";
export { clampZorluk } from "@/lib/onyx/solve-types";
export { formatSolveAsMarkdown } from "@/lib/onyx/solve-format";
export { buildOnyxSolveJsonSystemPrompt } from "@/lib/onyx/solve-json-prompt";

/** @deprecated Eski şema — yalnızca geriye dönük parse */
export function buildOnyxSolveLegacyJsonSystemPrompt(role?: OnyxRole): string {
  const protocol = buildVisionAcademicProtocolBlock(role);
  const coachField =
    role === "coach"
      ? '\n  "coach_insight": "Öğrencinin bu soruda takılma sebebi büyük ihtimalle [X konusu] eksikliğidir — somut konu adı",'
      : "";

  const core = `Sen DerecePanel Onyx Soru Çözme motorusun. Görsel veya metin soruyu ÖSYM formatında çöz.

${protocol}

Yanıtın YALNIZCA geçerli bir JSON nesnesi olsun — markdown kod bloğu ekleme.

Zorunlu şema:
{
  "cozum": "YALNIZCA TÜRKÇE Markdown: Temel formül kutusu → (varsa) şekil analizi → 1. Adım, 2. Adım… → ⚠️ ÖSYM Tuzağı",
  "konu_basligi": "YKS müfredatına uygun konu başlığı",
  "zorluk_seviyesi": 1,
  "hata_kodu": "KAVRAM_YANILGISI",${coachField}
}`;

  return finalizeOnyxSystemPrompt(core);
}
