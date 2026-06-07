import { panelGetItem, panelRemoveItem, panelSetItem } from "@/lib/panel-store";
import {
  GLOBAL_ALIAS_KEY,
  GLOBAL_DENEMELER_KEY,
  GLOBAL_DENEMELER_UPDATED,
  GLOBAL_EXAMS_LIVE_KEY,
} from "@/lib/exams/constants";
import { deriveDurum, enrichKurumDeneme, isPdfYuklu } from "@/lib/exams/enrich-exam";
import { computeMatrixPct } from "@/lib/exams/exam-evaluate";
import { getExamLayout } from "@/lib/exams/exam-layout";
import { syncMatrixFromExam } from "@/lib/exams/exam-matrix";
import { dispatchExamsChange } from "@/lib/exams/events";
import { readJsonArray, writeJson } from "@/lib/exams/storage/local-storage";
import type { GlobalExam, KurumDeneme, MergedExam, SinavTipi } from "@/lib/exams/types";

export function createGlobalDenemeId(): string {
  return `gd-${Date.now()}`;
}

export function normalizeExamRow(x: unknown): GlobalExam | null {
  if (!x || typeof x !== "object") return null;
  const o = { ...(x as GlobalExam) };
  const s = (o.sinav || o.tur || "TYT") as SinavTipi;
  o.sinav = s;
  o.tur = (o.tur || s) as GlobalExam["tur"];
  o.ad = o.ad || o.name || "";
  o.name = o.name || o.ad;
  if (o.yayinevi == null || o.yayinevi === "") o.yayinevi = "—";
  o.saat = o.saat || "09:00";
  o.atanan = 0;
  o.scope = "global";
  return o;
}

export function enrichGlobalExam(item: GlobalExam): GlobalExam {
  const n =
    item.soruSayisi ||
    (item.cevaplar?.length ? item.cevaplar.length : getExamLayout(item.sinav).n);
  const cevaplar = item.cevaplar || [];
  const pct =
    item.matrixPct != null ? Number(item.matrixPct) : computeMatrixPct(cevaplar, n);
  const pdfYuklu =
    item.pdfYuklu != null ? !!item.pdfYuklu : isPdfYuklu({ pdfName: item.pdfName, pdfUrl: item.pdfUrl });
  const durum = item.durum || deriveDurum(pct, pdfYuklu);
  return {
    ...item,
    soruSayisi: n,
    matrixPct: pct,
    pdfYuklu,
    durum,
    atanan: 0,
    cevaplar,
    zorluk: item.zorluk || [],
    konu: item.konu || [],
    konuYazi: item.konuYazi || [],
  };
}

/** Okuma: canonical live, yoksa mirror fallback */
export function loadGlobalExams(): GlobalExam[] {
  if (typeof window === "undefined") {
    return readJsonArray<GlobalExam>(GLOBAL_EXAMS_LIVE_KEY);
  }
  let raw = panelGetItem(GLOBAL_EXAMS_LIVE_KEY);
  if (raw == null || raw === "") {
    const fallback = readJsonArray<GlobalExam>(GLOBAL_DENEMELER_KEY, GLOBAL_ALIAS_KEY);
    return dedupGlobal(fallback.map(normalizeExamRow).filter(Boolean) as GlobalExam[]);
  }
  try {
    const arr = JSON.parse(raw) as unknown[];
    if (!Array.isArray(arr)) return [];
    return dedupGlobal(
      arr.map(normalizeExamRow).filter(Boolean) as GlobalExam[]
    ).sort(sortByDateTime);
  } catch {
    return [];
  }
}

function dedupGlobal(list: GlobalExam[]): GlobalExam[] {
  const seen: Record<string, boolean> = {};
  return list.filter((x) => {
    if (!x?.id || seen[x.id]) return false;
    seen[x.id] = true;
    return true;
  });
}

function sortByDateTime(a: GlobalExam, b: GlobalExam): number {
  const d = String(a.tarih).localeCompare(String(b.tarih));
  if (d !== 0) return d;
  return String(a.saat || "").localeCompare(String(b.saat || ""));
}

export function dispatchGlobalDenemelerUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(GLOBAL_DENEMELER_UPDATED));
  dispatchExamsChange();
}

/** Üçlü mirror yazma + event */
export function persistGlobalExams(list: GlobalExam[]) {
  const norm = list.map((x) => enrichGlobalExam(normalizeExamRow(x)!)).filter(Boolean);
  if (typeof window !== "undefined") {
    panelSetItem(GLOBAL_EXAMS_LIVE_KEY, JSON.stringify(norm));
    panelSetItem(GLOBAL_DENEMELER_KEY, JSON.stringify(norm));
    panelSetItem(GLOBAL_ALIAS_KEY, JSON.stringify(norm));
    dispatchGlobalDenemelerUpdated();
  } else {
    writeJson(GLOBAL_EXAMS_LIVE_KEY, norm);
    writeJson(GLOBAL_DENEMELER_KEY, norm);
    writeJson(GLOBAL_ALIAS_KEY, norm);
  }
  return norm;
}

export function upsertGlobalExam(item: GlobalExam) {
  const list = loadGlobalExams();
  const norm = enrichGlobalExam(normalizeExamRow(item)!);
  const idx = list.findIndex((e) => e.id === norm.id);
  if (idx >= 0) list[idx] = norm;
  else list.push(norm);
  persistGlobalExams(list);
  if (typeof window !== "undefined") {
    try {
      syncMatrixFromExam({
        ...norm,
        date: norm.tarih,
        isGlobal: true,
      } as MergedExam);
    } catch {
      /* ignore */
    }
  }
  return norm;
}

export function deleteGlobalExam(id: string) {
  persistGlobalExams(loadGlobalExams().filter((e) => e.id !== id));
}

/** Wizard kaydı → GlobalExam */
export function globalExamFromWizard(
  payload: KurumDeneme,
  prev?: GlobalExam | null
): GlobalExam {
  const row = normalizeExamRow({
    ...payload,
    tur: payload.sinav,
    yayinevi: prev?.yayinevi ?? "—",
    atanan: 0,
    scope: "global",
  })!;
  return enrichGlobalExam(row);
}

export function clearAllGlobalExamKeys() {
  if (typeof window === "undefined") return;
  panelRemoveItem(GLOBAL_EXAMS_LIVE_KEY);
  panelRemoveItem(GLOBAL_DENEMELER_KEY);
  panelRemoveItem(GLOBAL_ALIAS_KEY);
  dispatchGlobalDenemelerUpdated();
}
