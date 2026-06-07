import { readAnalizExamResults } from "@/lib/analiz/exam-results-source";
import type { ExamResultRow } from "@/lib/exams/types";

/** Kurumsal/global yüklemeden gelen gerçek examResults (Sonuç Merkezi ile aynı). */
export function getExamResults(): ExamResultRow[] {
  return readAnalizExamResults();
}

export function filterByExamId(rows: ExamResultRow[], examId: string): ExamResultRow[] {
  const eid = String(examId);
  return rows.filter((r) => r && String(r.examId) === eid);
}

export function averageNet(rows: ExamResultRow[]): number {
  const nets = rows
    .map((r) => Number(r?.net))
    .filter((n) => !Number.isNaN(n));
  if (!nets.length) return 0;
  const sum = nets.reduce((a, b) => a + b, 0);
  return Math.round((sum / nets.length) * 100) / 100;
}

function parseTime(iso: string | undefined): number {
  if (!iso) return 0;
  const t = Date.parse(String(iso));
  return Number.isNaN(t) ? 0 : t;
}

export function filterStudentHistory(all: ExamResultRow[], studentId: string): ExamResultRow[] {
  const sid = String(studentId);
  return all.filter((r) => r && String(r.studentId) === sid);
}

export function sortStudentHistoryByDate(
  history: ExamResultRow[],
  examMeta: Record<string, { date?: string; name?: string }>
): ExamResultRow[] {
  return [...history].sort((a, b) => {
    const ta =
      parseTime(a.savedAt) ||
      parseTime(examMeta[a.examId]?.date) ||
      0;
    const tb =
      parseTime(b.savedAt) ||
      parseTime(examMeta[b.examId]?.date) ||
      0;
    if (ta !== tb) return ta - tb;
    return String(a.examId || "").localeCompare(String(b.examId || ""));
  });
}

export function realNetsFromHistory(sorted: ExamResultRow[]): number[] {
  return sorted.map((r) => Number(r.net != null ? r.net : 0) || 0);
}

export function clampNet(x: number): number {
  return Math.max(0, Math.min(120, x));
}

export function predictNextThreeNets(realNets: number[]): [number, number, number] {
  const a = realNets || [];
  const n = a.length;
  if (n === 0) return [0, 0, 0];
  const last = a[n - 1]!;
  let delta = 0;
  if (n >= 3) {
    delta = (a[n - 1]! - a[n - 2]! + (a[n - 2]! - a[n - 3]!)) / 2;
  } else if (n === 2) {
    delta = a[1]! - a[0]!;
  } else {
    delta = 0.5;
  }
  const p1 = clampNet(last + delta);
  const p2 = clampNet(p1 + delta);
  const p3 = clampNet(p2 + delta);
  return [p1, p2, p3];
}

function shortLabel(name: string, idx: number): string {
  const s = String(name || "").trim() || `S${idx + 1}`;
  return s.length > 12 ? `${s.slice(0, 11)}…` : s;
}

export function buildTrendChartData(
  studentId: string,
  examMeta: Record<string, { date?: string; name?: string }>
) {
  const all = getExamResults();
  const hist = sortStudentHistoryByDate(filterStudentHistory(all, studentId), examMeta);
  const nets = realNetsFromHistory(hist);
  const pred = predictNextThreeNets(nets);
  const n = nets.length;

  const categories: string[] = [];
  for (let i = 0; i < n; i++) {
    const r = hist[i]!;
    const m = examMeta[r.examId];
    categories.push(shortLabel(m?.name || r.examName || "", i));
  }
  categories.push("+1", "+2", "+3");

  const L = categories.length;
  const actualSeries: (number | null)[] = Array(L).fill(null);
  const forecastSeries: (number | null)[] = Array(L).fill(null);
  for (let i = 0; i < n; i++) actualSeries[i] = nets[i]!;
  if (n > 0) forecastSeries[n - 1] = nets[n - 1]!;
  if (L >= n + 3) {
    forecastSeries[n] = pred[0];
    forecastSeries[n + 1] = pred[1];
    forecastSeries[n + 2] = pred[2];
  }

  const lo = Math.min(pred[0], pred[1], pred[2]);
  const hi = Math.max(pred[0], pred[1], pred[2]);
  const lastNet = n ? nets[n - 1]! : 0;
  const direction =
    n === 0
      ? "veri yok"
      : pred[2] > lastNet + 0.01
        ? "yükselişte"
        : pred[2] < lastNet - 0.01
          ? "düşüşte"
          : "sabit";

  const forecastText =
    n === 0
      ? `Bu öğrenci için sınav geçmişi yok; tahmin 0–${hi.toFixed(1)} net referans aralığıdır.`
      : `Otonom tahmin (sonraki 3 deneme): ${lo.toFixed(1)}–${hi.toFixed(1)} net · trend ${direction}.`;

  return {
    categories,
    actualSeries,
    forecastSeries,
    forecastText,
    realNets: nets,
    predictedNets: pred,
  };
}
