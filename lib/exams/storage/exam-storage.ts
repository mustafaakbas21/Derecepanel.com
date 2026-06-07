import { LEGACY_EXAMS_KEY } from "@/lib/exams/constants";
import { loadGlobalExams } from "@/lib/exams/storage/global-exam-storage";
import { getExamQuestionCount } from "@/lib/exams/exam-layout";
import {
  enrichKurumDeneme,
  durumLabel,
} from "@/lib/exams/enrich-exam";
import { syncMatrixFromExam } from "@/lib/exams/exam-matrix";
import { dispatchExamsChange } from "@/lib/exams/events";
import {
  loadKurumDenemelerMerged,
  persistKurumDenemelerMerged,
} from "@/lib/exams/storage/migrate-kurum";
import {
  hydrateExamMatrixForEdit,
  mergeMatrixArrays,
} from "@/lib/exams/storage/exam-matrix-hydrate";
import {
  attachKurumExamPdf,
} from "@/lib/exams/storage/kurum-pdf-storage";
import { readJsonArray } from "@/lib/exams/storage/local-storage";
import { readExamResults } from "@/lib/exams/storage/exam-results-storage";
import { getActiveCoachId, shouldFilterByCoach } from "@/lib/exams/coach-scope";
import { DEFAULT_COACH_ID } from "@/lib/students/constants";
import type { KurumDeneme, MergedExam, SinavTipi } from "@/lib/exams/types";

export { durumLabel, enrichKurumDeneme } from "@/lib/exams/enrich-exam";

const DEFAULT_INSTITUTION = "inst-default";

function dedupById<T extends { id: string }>(list: T[]): T[] {
  const seen: Record<string, boolean> = {};
  return list.filter((x) => {
    if (!x?.id || seen[x.id]) return false;
    seen[x.id] = true;
    return true;
  });
}

export function loadKurumDenemeler(): KurumDeneme[] {
  let list = loadKurumDenemelerMerged();
  if (shouldFilterByCoach()) {
    const cid = getActiveCoachId();
    list = list.filter(
      (e) => !e.coachId || e.coachId === cid || e.coachId === DEFAULT_COACH_ID
    );
  }
  return list;
}

export function saveKurumDenemeler(list: KurumDeneme[]) {
  persistKurumDenemelerMerged(list);
  dispatchExamsChange();
}

export function loadExamsBuckets(): { kurumsal: KurumDeneme[]; global: KurumDeneme[] } {
  const kurumsal = loadKurumDenemeler();
  const global = dedupById(loadGlobalExams() as KurumDeneme[]);
  const legacy = readJsonArray<KurumDeneme & { type?: string; scope?: string; kategori?: string }>(
    LEGACY_EXAMS_KEY
  );

  const kurumsalIds = new Set(kurumsal.map((k) => k.id));
  legacy.forEach((ex) => {
    if (!ex?.id || kurumsalIds.has(ex.id)) return;
    const t = String(ex.type || ex.scope || ex.kategori || "").toLowerCase();
    const isGlobal = t.includes("global");
    if (isGlobal) global.push(ex);
    else kurumsal.push(enrichKurumDeneme({ ...ex, scope: "kurumsal" }));
  });

  return {
    kurumsal: dedupById(kurumsal),
    global: dedupById(global),
  };
}

export function loadExamsFlat(): KurumDeneme[] {
  const b = loadExamsBuckets();
  return [...b.kurumsal, ...b.global];
}

function examSortKey(ex: { tarih?: string; date?: string }): number {
  const d = ex.date || ex.tarih || "";
  const t = Date.parse(String(d));
  return Number.isNaN(t) ? 0 : t;
}

function normalizeMerged(x: KurumDeneme, isGlobal: boolean): MergedExam {
  return {
    ...x,
    name: x.ad || (x as { name?: string }).name || x.id,
    date: x.tarih || (x as { date?: string }).date || "",
    isGlobal,
    ad: x.ad || (x as { name?: string }).name || "",
    tarih: x.tarih || (x as { date?: string }).date || "",
  };
}

export function loadMergedExams(): MergedExam[] {
  const buckets = loadExamsBuckets();
  const seen: Record<string, boolean> = {};
  const out: MergedExam[] = [];

  /** Global önce — aynı id çakışmasında global takvim matrisi korunur */
  buckets.global.forEach((x) => {
    if (!x?.id || seen[x.id]) return;
    seen[x.id] = true;
    out.push(normalizeMerged(x, true));
  });
  buckets.kurumsal.forEach((x) => {
    if (!x?.id || seen[x.id]) return;
    seen[x.id] = true;
    out.push(normalizeMerged(x, false));
  });
  out.sort((a, b) => examSortKey(b) - examSortKey(a));
  return out;
}

/**
 * Denemeyi kaynağına göre bul — global takvim veya kurumsal takvim (ESKİ pool parity).
 * Kurumsal deneme → kurum_denemeler; global → global_denemeler.
 */
export function findExamById(id: string): MergedExam | null {
  const sid = String(id || "").trim();
  if (!sid) return null;

  const { kurumsal, global } = loadExamsBuckets();

  const g = global.find((e) => String(e.id) === sid);
  if (g) return normalizeMerged(g, true);

  const k = kurumsal.find((e) => String(e.id) === sid);
  if (k) return normalizeMerged(k, false);

  return null;
}

/** Bugün ve sonrası, tamamlanmamış denemeler — tarihe göre artan sıralı. */
export function loadUpcomingExams(limit?: number): MergedExam[] {
  const t0 = todayIso();
  const list = loadMergedExams()
    .filter(
      (e) => e.tarih && String(e.tarih) >= t0 && e.durum !== "tamamlandi"
    )
    .sort(
      (a, b) =>
        String(a.tarih).localeCompare(String(b.tarih)) ||
        String(a.saat || "").localeCompare(String(b.saat || ""))
    );
  return typeof limit === "number" ? list.slice(0, limit) : list;
}

export function countExamResultsParticipants(examId: string): number {
  const want = String(examId);
  const seen: Record<string, boolean> = {};
  let n = 0;
  for (const r of readExamResults()) {
    if (!r || String(r.examId) !== want) continue;
    const sid =
      r.studentId != null && r.studentId !== ""
        ? String(r.studentId)
        : r.studentCode != null && r.studentCode !== ""
          ? String(r.studentCode)
          : "";
    if (!sid || seen[sid]) continue;
    seen[sid] = true;
    n++;
  }
  return n;
}

export function initMatrix(sinav: SinavTipi, n?: number) {
  const count = n ?? getExamQuestionCount(sinav);
  return {
    soruSayisi: count,
    cevaplar: Array(count).fill(""),
    zorluk: Array(count).fill("2"),
    konu: Array(count).fill(""),
    konuYazi: Array(count).fill(""),
  };
}

export function createKurumDenemeId() {
  return `kd-${Date.now()}`;
}

export function getKurumDenemeById(id: string): KurumDeneme | null {
  const sid = String(id || "").trim();
  if (!sid) return null;
  const item = loadKurumDenemelerMerged().find((x) => x.id === sid) ?? null;
  if (!item) return null;
  return hydrateExamMatrixForEdit(attachKurumExamPdf(item));
}

export function upsertKurumDeneme(payload: KurumDeneme): KurumDeneme {
  const list = loadKurumDenemelerMerged();
  const idx = list.findIndex((x) => x.id === payload.id);
  const now = new Date().toISOString();
  const existing = idx >= 0 ? list[idx] : null;
  const n = payload.soruSayisi || getExamQuestionCount(payload.sinav);
  const base: KurumDeneme = {
    ...(existing || {}),
    ...payload,
    scope: "kurumsal",
    institutionId: payload.institutionId || existing?.institutionId || DEFAULT_INSTITUTION,
    coachId: payload.coachId || existing?.coachId || getActiveCoachId() || DEFAULT_COACH_ID,
    updatedAt: now,
    createdAt: payload.createdAt || existing?.createdAt || now,
    cevaplar: mergeMatrixArrays(payload.cevaplar, existing?.cevaplar, n),
    zorluk: mergeMatrixArrays(payload.zorluk, existing?.zorluk, n, "2"),
    konu: mergeMatrixArrays(payload.konu, existing?.konu, n),
    konuYazi: mergeMatrixArrays(payload.konuYazi, existing?.konuYazi, n),
  };
  const toSave = enrichKurumDeneme(base);
  if (idx >= 0) list[idx] = toSave;
  else list.unshift(toSave);
  saveKurumDenemeler(list);
  if (typeof window !== "undefined") {
    try {
      syncMatrixFromExam(toSave);
    } catch {
      /* ignore */
    }
  }
  return toSave;
}

export function deleteKurumDeneme(id: string) {
  const list = loadKurumDenemelerMerged().filter((x) => x.id !== id);
  persistKurumDenemelerMerged(list);
  dispatchExamsChange();
}

export function copyKurumDeneme(id: string): KurumDeneme | null {
  const item = loadKurumDenemelerMerged().find((x) => x.id === id);
  if (!item) return null;
  const m = initMatrix(item.sinav);
  const copy: KurumDeneme = {
    ...item,
    id: createKurumDenemeId(),
    ad: `${item.ad} (kopya)`,
    durum: "taslak",
    matrixPct: 0,
    atanan: 0,
    pdfYuklu: false,
    pdfName: undefined,
    pdfUrl: undefined,
    cevaplar: m.cevaplar,
    zorluk: m.zorluk,
    konu: m.konu,
    konuYazi: m.konuYazi,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return upsertKurumDeneme(copy);
}

export function formatTrDate(iso: string): string {
  if (!iso || String(iso).length < 10) return iso || "—";
  const p = String(iso).split("-");
  if (p.length < 3) return iso;
  return `${p[2]}.${p[1]}.${p[0]}`;
}

export function formatTrDateTime(tarih: string, saat: string): string {
  return `${formatTrDate(tarih)} · ${saat || "09:00"}`;
}

export function todayIso(): string {
  const t = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
}

/** Öğrenci: tarih >= bugün, aktif/yayında veya taslak gelecek denemeler */
export function loadUpcomingKurumDenemelerForStudent(options?: {
  institutionId?: string;
  ogrenciKapsam?: "tum" | "secili";
}): KurumDeneme[] {
  const t0 = todayIso();
  return loadKurumDenemelerMerged()
    .filter((r) => {
      if (!r?.tarih || String(r.tarih) < t0) return false;
      if (options?.institutionId && r.institutionId && r.institutionId !== options.institutionId)
        return false;
      if (options?.ogrenciKapsam === "secili" && r.ogrenciKapsam === "secili") {
        /* MVP: secili = kurum içi hedefli — tüm kurum öğrencileri görür */
      }
      return r.durum !== "tamamlandi";
    })
    .sort(
      (a, b) =>
        String(a.tarih).localeCompare(String(b.tarih)) ||
        String(a.saat || "").localeCompare(String(b.saat || ""))
    );
}
