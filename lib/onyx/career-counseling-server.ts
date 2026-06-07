import "server-only";

import {
  alignCareerWithGroundTruth,
  enrichCareerWithAtlasPrograms,
  formatCareerCounselingFallbackMarkdown,
} from "@/lib/onyx/career-counseling";
import type { CareerAtlasRow, OnyxCareerCounseling } from "@/lib/onyx/career-types";
import { extractOgrenciNetleriFromContext } from "@/lib/onyx/career-rag-server";
import { resolveStudentHedef } from "@/lib/onyx/resolve-student-hedef";
import { generateOnyxObject } from "@/lib/onyx/generate-onyx-object";
import { OnyxGroqError } from "@/lib/onyx/groq-server";
import { finalizeOnyxSystemPrompt } from "@/lib/onyx/language-rule";
import type { OnyxRole } from "@/lib/onyx/role-quick-prompts";
import { onyxCareerCounselingSchema } from "@/lib/onyx/skill-schemas";
import {
  buildCareerFallbackFromRag,
  isCareerPlaceholderOutput,
} from "@/lib/onyx/career-counseling-coerce";

import { ONYX_DENEME_NET_HESAPLAMA_KURALI } from "@/lib/onyx/fetch-latest-deneme-nets-server";

export const ONYX_CAREER_STRICT_RULES = `Sen DerecePanel'in resmi Kariyer ve Tercih Danışmanısın (Onyx).

KURALLAR:
1. Asla kendi kafandan taban puanı, başarı sırası, kontenjan veya üniversite/program adı UYDURMA.
2. SADECE "[GERÇEK VERİLER]" bloğu ve PROGRAM TABLOSU satırlarını kullan.
3. Ana analiz konusu HEDEF (profil) satırıdır — atlas listesindeki rastgele bir bölümü hedef sanma.
4. Öğrenci neti "bulunamadi" ise mevcutDurum alanında "Veri bulunamadı — mevcut net bilinmiyor" yaz; net tahmini YAPMA, TYT neti 0 yazma.
5. Program listesi boşsa alternatiflerde somut taban yazma.
6. Şema alan açıklamalarını veya örnek talimat cümlelerini ÇIKTI OLARAK KOPYALAMA — her alana gerçek, tam Türkçe cümleler yaz.
7. avantajVeDezavantajlar dizisi yalnızca düz metin string içermeli; nesne kullanma.
8. ${ONYX_DENEME_NET_HESAPLAMA_KURALI}

JSON alanları (içerik gerçek veriye dayanmalı):
- meslekAnalizi.gelecekVizyonu: Hedef bölümün sektörü, iş imkanları, 2–4 cümle analiz
- meslekAnalizi.avantajVeDezavantajlar: En az 2 madde, somut avantaj ve dezavantaj
- netAnaliziVeAlternatifler.mevcutDurum: Öğrenci netleri ile atlas taban karşılaştırması
- hedefeYakinAlternatifler: PROGRAM TABLOSUNDAN gerçek üniversite — bölüm satırları (en az 1, en fazla 4)
- farkliAmaGelecegiParlakBölümler: Hedeften FARKLI alanlar (her biri farklı bölüm adı); nedenUygun alanında iş imkanı/sektör trendi yaz, yalnızca taban puanı yazma (0–3)
- onyxTavsiyesi: Koça/öğrenciye 2 cümlelik net tavsiye`;

export function buildCareerCounselingSystemPrompt(role?: OnyxRole): string {
  const roleHint =
    role === "coach"
      ? "\nKoç modundasın: veli/koç için net, rapor dili kullan; öğrenciye yönelik tavsiyeyi onyxTavsiyesi alanında ver."
      : "";
  return finalizeOnyxSystemPrompt(`${ONYX_CAREER_STRICT_RULES}${roleHint}`);
}

function extractCareerRagBlocks(studentData: unknown): string {
  if (!studentData || typeof studentData !== "object") return "";
  const kb = (studentData as Record<string, unknown>).kariyerVeriTabani;
  if (!kb || typeof kb !== "object") return "";
  const record = kb as Record<string, unknown>;
  const strict = record.strictVeriBloku;
  const ozet = record.ozetMetin;
  const parts: string[] = [];
  if (typeof strict === "string" && strict.trim()) parts.push(strict.trim());
  if (typeof ozet === "string" && ozet.trim()) parts.push(ozet.trim());
  return parts.join("\n\n");
}

function extractAtlasPrograms(studentData: unknown): CareerAtlasRow[] {
  if (!studentData || typeof studentData !== "object") return [];
  const kb = (studentData as Record<string, unknown>).kariyerVeriTabani;
  if (!kb || typeof kb !== "object") return [];
  const programs = (kb as Record<string, unknown>).programlar;
  if (!Array.isArray(programs)) return [];
  return programs.filter(
    (p): p is CareerAtlasRow =>
      Boolean(p) && typeof p === "object" && "bolum" in (p as object)
  ) as CareerAtlasRow[];
}

function extractParlakPrograms(studentData: unknown): CareerAtlasRow[] {
  if (!studentData || typeof studentData !== "object") return [];
  const kb = (studentData as Record<string, unknown>).kariyerVeriTabani;
  if (!kb || typeof kb !== "object") return [];
  const programs = (kb as Record<string, unknown>).parlakProgramlar;
  if (!Array.isArray(programs)) return [];
  return programs.filter(
    (p): p is CareerAtlasRow =>
      Boolean(p) && typeof p === "object" && "bolum" in (p as object)
  ) as CareerAtlasRow[];
}

export async function completeCareerCounseling(input: {
  prompt: string;
  studentData: unknown;
  role?: OnyxRole;
}): Promise<{
  reply: string;
  model: string;
  career: OnyxCareerCounseling;
  usedFallback?: boolean;
}> {
  const prompt = input.prompt.trim();
  if (!prompt) {
    throw new OnyxGroqError("Kariyer sorusu boş olamaz.", "BAD_REQUEST");
  }

  const ragBlock = extractCareerRagBlocks(input.studentData);
  const atlasPrograms = extractAtlasPrograms(input.studentData);
  const parlakPrograms = extractParlakPrograms(input.studentData);
  const resolvedHedef = resolveStudentHedef(input.studentData);
  const nets = extractOgrenciNetleriFromContext(input.studentData);

  const hedefHint = resolvedHedef
    ? `\n[PROFİL HEDEFİ] ${resolvedHedef.label}`
    : "";

  const system = [buildCareerCounselingSystemPrompt(input.role), ragBlock, hedefHint]
    .filter(Boolean)
    .join("\n\n");

  const userPrompt = `${prompt}

[ÇIKTI TALİMATI]
- Yukarıdaki GERÇEK VERİLER ve PROGRAM TABLOSUNU kullan.
- Şema talimatlarını veya örnek cümleleri kopyalama; her alana özgün Türkçe metin yaz.
- bolum alanlarında gerçek üniversite ve bölüm adları kullan.`;

  let career: OnyxCareerCounseling;
  let model = "rag-fallback";
  let usedFallback = true;

  try {
    const result = await generateOnyxObject({
      schema: onyxCareerCounselingSchema,
      system,
      prompt: userPrompt,
      isDeepMode: true,
    });

    career = result.object;
    model = result.model;
    usedFallback = Boolean(result.usedFallback);

    if (isCareerPlaceholderOutput(career)) {
      try {
        const retry = await generateOnyxObject({
          schema: onyxCareerCounselingSchema,
          system,
          prompt: `${userPrompt}

[UYARI] Önceki yanıt şablon metni içeriyordu. Yalnızca atlas satırları ve net verisine dayalı somut cümleler yaz.`,
          isDeepMode: true,
        });
        career = retry.object;
        model = retry.model;
        usedFallback = true;
      } catch {
        career = buildCareerFallbackFromRag({
          studentData: input.studentData,
          atlasPrograms,
        });
      }
    }
  } catch (err) {
    console.warn("[Onyx] Kariyer generateObject başarısız, RAG yedeği:", err);
    career = buildCareerFallbackFromRag({
      studentData: input.studentData,
      atlasPrograms,
    });
  }

  if (isCareerPlaceholderOutput(career)) {
    career = buildCareerFallbackFromRag({
      studentData: input.studentData,
      atlasPrograms,
    });
    usedFallback = true;
  }

  career = enrichCareerWithAtlasPrograms(career, atlasPrograms);
  career = alignCareerWithGroundTruth(career, {
    hedef: resolvedHedef,
    atlasPrograms,
    parlakPrograms,
    nets,
  });

  return {
    reply: formatCareerCounselingFallbackMarkdown(career),
    model,
    usedFallback,
    career,
  };
}
