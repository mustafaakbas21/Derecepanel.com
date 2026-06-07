import "server-only";

import type { CareerAtlasRow } from "@/lib/onyx/career-types";
import { normalizeAnalyticsSkillData } from "@/lib/onyx/analytics-normalize";
import { buildSkillSystemPrompt } from "@/lib/onyx/skill-prompts-server";
import {
  generateOnyxObject,
  ONYX_SKILL_COMPLETION_MAX_TOKENS,
} from "@/lib/onyx/generate-onyx-object";
import { OnyxGroqError } from "@/lib/onyx/groq-server";
import {
  ONYX_STRATEGY_COMPLETION_MAX_TOKENS,
  ONYX_YOUTUBE_COMPLETION_MAX_TOKENS,
} from "@/lib/onyx/constants";
import {
  ONYX_STRATEGY_CONTEXT_MAX_CHARS,
  truncateOnyxText,
} from "@/lib/onyx/prompt-budget";
import type { OnyxRole } from "@/lib/onyx/role-quick-prompts";
import { getOnyxSkillResponseSchema } from "@/lib/onyx/skill-schemas";
import type {
  OnyxSkillResponse,
  OnyxSkillType,
} from "@/lib/onyx/skill-types";
import { enrichStrategyFromGroundTruth } from "@/lib/onyx/strategy-normalize";
import { ensureStrategyMinimums } from "@/lib/onyx/strategy-skill-coerce";
import { pickStrategyMevcutNet } from "@/lib/onyx/kurumsal-exam-results";
import {
  prepareYoutubePromptForAi,
  shrinkYoutubeAiPrompt,
  YOUTUBE_PROMPT_RAG_MARKER,
  ONYX_YOUTUBE_PROMPT_MAX_CHARS,
} from "@/lib/onyx/youtube-transcript-server";
import { isYoutubeLinkInText } from "@/lib/onyx/youtube-link";
import { coerceMentalSkillData } from "@/lib/onyx/mental-skill-coerce";

function extractStrategyContext(studentData: unknown): string {
  if (!studentData || typeof studentData !== "object") return "";
  const ctx = studentData as Record<string, unknown>;
  const kb = ctx.kariyerVeriTabani ?? ctx.stratejiVeriTabani;
  const strict =
    kb && typeof kb === "object"
      ? String((kb as Record<string, unknown>).strictVeriBloku ?? "").trim()
      : "";

  const ogrenci = ctx.ogrenci;
  const denemeler = Array.isArray(ctx.sonUcDeneme)
    ? ctx.sonUcDeneme.slice(0, 3)
    : [];
  const eksikKonular = Array.isArray(ctx.eksikKonular)
    ? ctx.eksikKonular.slice(0, 8)
    : ctx.eksikKonular;
  const zayif = Array.isArray(ctx.zayifKonuHakimiyeti)
    ? ctx.zayifKonuHakimiyeti.slice(0, 8)
    : ctx.zayifKonuHakimiyeti;

  const panelOzet = JSON.stringify({
    ogrenci,
    sonDenemeler: denemeler,
    kurumsalDenemeOzeti: ctx.kurumsalDenemeOzeti,
    eksikKonular,
    zayifKonuHakimiyeti: zayif,
  });

  return truncateOnyxText(
    [strict, `[PANEL ÖZET]\n${panelOzet}`].filter(Boolean).join("\n\n"),
    ONYX_STRATEGY_CONTEXT_MAX_CHARS
  );
}

function extractAtlasPrograms(studentData: unknown): CareerAtlasRow[] {
  if (!studentData || typeof studentData !== "object") return [];
  const kb =
    (studentData as Record<string, unknown>).kariyerVeriTabani ??
    (studentData as Record<string, unknown>).stratejiVeriTabani;
  if (!kb || typeof kb !== "object") return [];
  const programs = (kb as Record<string, unknown>).programlar;
  if (!Array.isArray(programs)) return [];
  return programs.filter(
    (p): p is CareerAtlasRow =>
      Boolean(p) && typeof p === "object" && "bolum" in (p as object)
  ) as CareerAtlasRow[];
}

function extractPanelHedef(studentData: unknown): {
  universite?: string;
  bolum?: string;
} {
  if (!studentData || typeof studentData !== "object") return {};
  const ogrenci = (studentData as Record<string, unknown>).ogrenci;
  if (!ogrenci || typeof ogrenci !== "object") return {};
  const hedef = (ogrenci as Record<string, unknown>).hedef;
  if (!hedef || typeof hedef !== "object") return {};
  const h = hedef as Record<string, unknown>;
  return {
    universite: String(h.universite ?? "").trim() || undefined,
    bolum: String(h.bolum ?? "").trim() || undefined,
  };
}

function extractKurumsalDenemeOzeti(studentData: unknown): {
  sonTyTNet: number | null;
  sonAytNet: number | null;
  veriBilinmiyor: boolean;
} {
  if (!studentData || typeof studentData !== "object") {
    return { sonTyTNet: null, sonAytNet: null, veriBilinmiyor: false };
  }
  const ctx = studentData as Record<string, unknown>;

  const supabase = ctx.supabaseSonDeneme;
  if (supabase && typeof supabase === "object") {
    const s = supabase as Record<string, unknown>;
    if (s.durum !== "mevcut") {
      return { sonTyTNet: null, sonAytNet: null, veriBilinmiyor: true };
    }
    const tyt = s.sonTyTNet;
    const ayt = s.sonAytNet;
    return {
      sonTyTNet:
        tyt != null && Number.isFinite(Number(tyt)) ? Number(tyt) : null,
      sonAytNet:
        ayt != null && Number.isFinite(Number(ayt)) ? Number(ayt) : null,
      veriBilinmiyor: false,
    };
  }

  const ozet = ctx.kurumsalDenemeOzeti;
  if (!ozet || typeof ozet !== "object") {
    return { sonTyTNet: null, sonAytNet: null, veriBilinmiyor: false };
  }
  const o = ozet as Record<string, unknown>;
  const tyt = o.sonTyTNet;
  const ayt = o.sonAytNet;
  return {
    sonTyTNet:
      tyt != null && Number.isFinite(Number(tyt)) ? Number(tyt) : null,
    sonAytNet:
      ayt != null && Number.isFinite(Number(ayt)) ? Number(ayt) : null,
    veriBilinmiyor: false,
  };
}

function extractLatestNet(studentData: unknown): number | null {
  const { sonTyTNet, veriBilinmiyor } = extractKurumsalDenemeOzeti(studentData);
  if (veriBilinmiyor) return null;
  if (sonTyTNet != null) return sonTyTNet;

  if (!studentData || typeof studentData !== "object") return null;
  const ctx = studentData as Record<string, unknown>;

  const denemeler = ctx.sonUcDeneme;
  if (Array.isArray(denemeler) && denemeler.length > 0) {
    return pickStrategyMevcutNet(
      denemeler.map((d) => {
        const row = d as Record<string, unknown>;
        return {
          examId: String(row.examId ?? ""),
          ad: String(row.ad ?? ""),
          tarih: String(row.tarih ?? ""),
          sinav: String(row.sinav ?? "TYT"),
          net:
            row.net != null && Number.isFinite(Number(row.net))
              ? Number(row.net)
              : null,
          kaynak: "kurumsal" as const,
        };
      })
    );
  }
  return null;
}

function extractMentalContext(studentData: unknown): string {
  if (!studentData || typeof studentData !== "object") return "";
  const ctx = studentData as Record<string, unknown>;
  const denemeler = Array.isArray(ctx.sonUcDeneme)
    ? ctx.sonUcDeneme.slice(0, 3)
    : [];
  const ogrenci = ctx.ogrenci;
  const denemeBlock = ctx.onyxDenemeOzeti ?? ctx.denemeOzeti;
  if (!denemeler.length && !ogrenci && !denemeBlock) return "";

  return JSON.stringify({
    ogrenci,
    sonDenemeler: denemeler,
    denemeOzeti: denemeBlock,
    basariliKonular: ctx.gucluKonular ?? ctx.basariliKonular,
  });
}

function extractAnalyticsContext(studentData: unknown): string {
  if (!studentData || typeof studentData !== "object") return "";
  const ctx = studentData as Record<string, unknown>;
  const denemeler = Array.isArray(ctx.sonUcDeneme)
    ? ctx.sonUcDeneme.slice(0, 5)
    : [];
  const ogrenci = ctx.ogrenci;
  if (!denemeler.length && !ogrenci) return "";

  return JSON.stringify({
    ogrenci,
    sonDenemeler: denemeler,
    eksikKonular: ctx.eksikKonular,
    zayifKonuHakimiyeti: ctx.zayifKonuHakimiyeti,
    kritikKonuTrendleri: ctx.kritikKonuTrendleri,
  });
}

async function resolvePromptForSkill(
  skillType: OnyxSkillType,
  prompt: string
): Promise<string> {
  if (skillType !== "youtube_assistant") return prompt;

  if (prompt.includes(YOUTUBE_PROMPT_RAG_MARKER)) {
    return shrinkYoutubeAiPrompt(prompt, ONYX_YOUTUBE_PROMPT_MAX_CHARS);
  }

  if (isYoutubeLinkInText(prompt)) {
    const prepared = await prepareYoutubePromptForAi(prompt);
    return shrinkYoutubeAiPrompt(prepared, ONYX_YOUTUBE_PROMPT_MAX_CHARS);
  }

  return `${prompt}\n\n[Not: Öğrenci henüz YouTube linki göndermedi. Link iste veya genel YKS konu çerçevesinde yanıt ver.]`;
}

function finalizeSkillResponse(
  skillType: OnyxSkillType,
  response: OnyxSkillResponse,
  studentData?: unknown
): OnyxSkillResponse {
  if (skillType === "analytics" && response.type === "analytics") {
    const normalized = normalizeAnalyticsSkillData(
      response.data as unknown as Record<string, unknown>
    );
    if (!normalized) return response;
    return { type: "analytics", data: normalized };
  }

  if (skillType === "strategy" && response.type === "strategy") {
    const panel = extractPanelHedef(studentData);
    const kurumsal = extractKurumsalDenemeOzeti(studentData);
    const withMinimums = ensureStrategyMinimums(response.data);
    const enriched = enrichStrategyFromGroundTruth(withMinimums, {
      atlasPrograms: extractAtlasPrograms(studentData),
      panelUniversite: panel.universite,
      panelBolum: panel.bolum,
      sonTyTNet: kurumsal.veriBilinmiyor ? null : kurumsal.sonTyTNet,
      sonAytNet: kurumsal.veriBilinmiyor ? null : kurumsal.sonAytNet,
      sonDenemeNet: kurumsal.veriBilinmiyor
        ? null
        : extractLatestNet(studentData),
      denemeVerisiBilinmiyor: kurumsal.veriBilinmiyor,
    });
    return { type: "strategy", data: enriched };
  }

  if (skillType === "mental_coach" && response.type === "mental") {
    const coerced = coerceMentalSkillData(response.data);
    if (coerced) return { type: "mental", data: coerced };
  }

  return response;
}

export async function completeStructuredSkill(input: {
  skillType: OnyxSkillType;
  prompt: string;
  studentData?: unknown;
  role?: OnyxRole;
  extraSystemContext?: string;
}): Promise<{
  reply: string;
  model: string;
  skillResponse: OnyxSkillResponse;
  usedFallback?: boolean;
}> {
  const prompt = input.prompt.trim();
  if (!prompt) {
    throw new OnyxGroqError("İstek metni boş olamaz.", "BAD_REQUEST");
  }

  const promptForAi = await resolvePromptForSkill(input.skillType, prompt);

  const analyticsCtx =
    input.skillType === "analytics"
      ? extractAnalyticsContext(input.studentData)
      : "";
  const strategyCtx =
    input.skillType === "strategy"
      ? extractStrategyContext(input.studentData)
      : "";
  const mentalCtx =
    input.skillType === "mental_coach"
      ? extractMentalContext(input.studentData)
      : "";
  const extra = [
    input.extraSystemContext,
    analyticsCtx ? `[ÖĞRENCİ ANALİZ VERİSİ]\n${analyticsCtx}` : "",
    strategyCtx,
    mentalCtx
      ? `[ÖĞRENCİ VERİSİ — kanitlar alanında yalnızca buradaki somut veriyi kullan; uydurma net yazma]\n${mentalCtx}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const system = buildSkillSystemPrompt(
    input.skillType,
    input.role,
    extra
  );

  const isRichSkill =
    input.skillType === "youtube_assistant" ||
    input.skillType === "mental_coach";

  const maxTokens =
    input.skillType === "strategy"
      ? ONYX_STRATEGY_COMPLETION_MAX_TOKENS
      : input.skillType === "youtube_assistant"
        ? ONYX_YOUTUBE_COMPLETION_MAX_TOKENS
        : isRichSkill
          ? ONYX_SKILL_COMPLETION_MAX_TOKENS
          : undefined;

  const useDeepStructured =
    input.skillType !== "strategy" && input.skillType !== "youtube_assistant";

  const schema = getOnyxSkillResponseSchema(input.skillType);

  const result = await generateOnyxObject({
    schema,
    system,
    prompt: promptForAi,
    isDeepMode: useDeepStructured,
    maxTokens,
  });

  const skillResponse = finalizeSkillResponse(
    input.skillType,
    result.object as OnyxSkillResponse,
    input.studentData
  );

  return {
    reply: JSON.stringify(skillResponse),
    model: result.model,
    skillResponse,
    usedFallback: result.usedFallback,
  };
}

type StructuredSkillInput = Omit<
  Parameters<typeof completeStructuredSkill>[0],
  "skillType"
>;

export async function completeStrategySkill(input: StructuredSkillInput) {
  return completeStructuredSkill({ ...input, skillType: "strategy" });
}

export async function completeAnalyticsSkill(input: StructuredSkillInput) {
  return completeStructuredSkill({ ...input, skillType: "analytics" });
}

export async function completeYoutubeAssistantSkill(input: StructuredSkillInput) {
  return completeStructuredSkill({ ...input, skillType: "youtube_assistant" });
}

export async function completeMentalCoachSkill(input: StructuredSkillInput) {
  return completeStructuredSkill({ ...input, skillType: "mental_coach" });
}
