import { computeRankMeta, studentRowKey } from "@/lib/exams/exam-rank";
import { resultsForExam } from "@/lib/exams/exam-results-storage";
import { findExamById, formatTrDate, loadMergedExams } from "@/lib/exams/exam-storage";
import type { ExamResultRow } from "@/lib/exams/types";
import { readStudentExamResults, studentExamResultIds } from "@/lib/student/exam-results-scope";

export type StudentResultView = {
  result: ExamResultRow;
  examId: string;
  examName: string;
  sinav: string;
  tarih: string;
  dateLabel: string;
  isGlobal: boolean;
  net: number | null;
  correct: number;
  wrong: number;
  blank: number;
  genelRank: number | null;
  classRank: number | null;
  participantCount: number;
  netDelta: number | null;
  accuracyPct: number | null;
};

export type StudentResultsStats = {
  total: number;
  avgNet: number | null;
  bestNet: number | null;
  lastNet: number | null;
  totalCorrect: number;
  totalWrong: number;
  totalBlank: number;
  kurumsalCount: number;
  globalCount: number;
  trendDelta: number | null;
};

function roundNet(n: number) {
  return Math.round(n * 10) / 10;
}

export function buildStudentResultViews(
  results: ExamResultRow[] = readStudentExamResults()
): StudentResultView[] {
  const examMeta = new Map(
    loadMergedExams().map((e) => [
      e.id,
      {
        name: e.name || e.ad || e.id,
        sinav: e.sinav || "TYT",
        tarih: e.tarih || e.date || "",
        isGlobal: e.isGlobal,
      },
    ])
  );

  const sorted = [...results].sort((a, b) => {
    const da = examMeta.get(a.examId)?.tarih || a.savedAt?.slice(0, 10) || "";
    const db = examMeta.get(b.examId)?.tarih || b.savedAt?.slice(0, 10) || "";
    return db.localeCompare(da);
  });

  const views: StudentResultView[] = sorted.map((result, index) => {
    const meta = examMeta.get(result.examId);
    const exam = findExamById(result.examId);
    const allRows = resultsForExam(result.examId);
    const rankMeta = computeRankMeta(allRows);
    const key = studentRowKey(result);
    const net = typeof result.net === "number" && Number.isFinite(result.net) ? roundNet(result.net) : null;
    const correct = result.correct ?? 0;
    const wrong = result.wrong ?? 0;
    const blank = result.blank ?? 0;
    const totalQ = correct + wrong + blank;
    const accuracyPct = totalQ > 0 ? Math.round((correct / totalQ) * 100) : null;

    const newer = sorted[index + 1];
    const newerNet =
      newer && typeof newer.net === "number" && Number.isFinite(newer.net)
        ? roundNet(newer.net)
        : null;
    const netDelta = net != null && newerNet != null ? roundNet(net - newerNet) : null;

    const tarih = meta?.tarih || result.savedAt?.slice(0, 10) || "";

    return {
      result,
      examId: result.examId,
      examName: meta?.name || result.examName || "Deneme",
      sinav: meta?.sinav || exam?.sinav || "TYT",
      tarih,
      dateLabel: tarih ? formatTrDate(tarih) : "—",
      isGlobal: meta?.isGlobal ?? exam?.isGlobal ?? false,
      net,
      correct,
      wrong,
      blank,
      genelRank: rankMeta.genel[key] ?? null,
      classRank: rankMeta.sinif[key] ?? null,
      participantCount: rankMeta.total,
      netDelta,
      accuracyPct,
    };
  });

  return views;
}

export function computeStudentResultsStats(views: StudentResultView[]): StudentResultsStats {
  const nets = views.map((v) => v.net).filter((n): n is number => n != null);
  const avgNet = nets.length
    ? roundNet(nets.reduce((s, n) => s + n, 0) / nets.length)
    : null;
  const bestNet = nets.length ? Math.max(...nets) : null;
  const lastNet = views[0]?.net ?? null;
  const trendDelta = views[0]?.netDelta ?? null;

  return {
    total: views.length,
    avgNet,
    bestNet,
    lastNet,
    totalCorrect: views.reduce((s, v) => s + v.correct, 0),
    totalWrong: views.reduce((s, v) => s + v.wrong, 0),
    totalBlank: views.reduce((s, v) => s + v.blank, 0),
    kurumsalCount: views.filter((v) => !v.isGlobal).length,
    globalCount: views.filter((v) => v.isGlobal).length,
    trendDelta,
  };
}

export function filterStudentResultViews(
  views: StudentResultView[],
  options: {
    scope: "all" | "kurumsal" | "global";
    sinav: "all" | "TYT" | "AYT" | "YDT";
    search: string;
  }
): StudentResultView[] {
  const q = options.search.trim().toLowerCase();
  return views.filter((view) => {
    if (options.scope === "kurumsal" && view.isGlobal) return false;
    if (options.scope === "global" && !view.isGlobal) return false;
    if (options.sinav !== "all" && view.sinav !== options.sinav) return false;
    if (!q) return true;
    return `${view.examName} ${view.sinav} ${view.dateLabel}`.toLowerCase().includes(q);
  });
}

export { studentExamResultIds };
