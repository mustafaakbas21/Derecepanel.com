import {
  KURUM_ALIAS_KEY,
  KURUM_DENEMELER_KEY,
  LEGACY_EXAMS_KEY,
} from "@/lib/exams/constants";
import { readJsonArray, writeJson } from "@/lib/exams/storage/local-storage";
import { enrichKurumDeneme } from "@/lib/exams/enrich-exam";
import {
  attachKurumExamPdf,
  stripKurumExamPdf,
} from "@/lib/exams/storage/kurum-pdf-storage";
import type { KurumDeneme } from "@/lib/exams/types";

function dedupById(list: KurumDeneme[]): KurumDeneme[] {
  const seen: Record<string, boolean> = {};
  return list.filter((x) => {
    if (!x?.id || seen[x.id]) return false;
    seen[x.id] = true;
    return true;
  });
}

/** kurum_denemeler_v1 + kurumsalExams + legacy exams (non-global) */
export function loadKurumDenemelerMerged(): KurumDeneme[] {
  const primary = readJsonArray<KurumDeneme>(KURUM_DENEMELER_KEY);
  const alias = readJsonArray<KurumDeneme>(KURUM_ALIAS_KEY);
  const legacy = readJsonArray<KurumDeneme & { type?: string; scope?: string }>(LEGACY_EXAMS_KEY);

  const kurumsal: KurumDeneme[] = [...primary, ...alias];
  legacy.forEach((ex) => {
    if (!ex?.id) return;
    const t = String(ex.type || ex.scope || "").toLowerCase();
    if (!t.includes("global")) kurumsal.push(ex);
  });

  return dedupById(kurumsal).map((item) => attachKurumExamPdf(enrichKurumDeneme(item)));
}

export function persistKurumDenemelerMerged(list: KurumDeneme[]) {
  const normalized = list.map((item) => enrichKurumDeneme(stripKurumExamPdf(item)));
  try {
    writeJson(KURUM_DENEMELER_KEY, normalized);
  } catch (err) {
    console.warn("[kurum_denemeler] persist failed, retrying lean payload", err);
    writeJson(KURUM_DENEMELER_KEY, normalized);
  }
}
