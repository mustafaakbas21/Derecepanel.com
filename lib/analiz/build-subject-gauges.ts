import { buildDyBSummaryGauges, isDyBSummaryGaugeName } from "@/lib/analiz/chart-fallbacks";
import { matrixHasTopicLabels } from "@/lib/analiz/matrix-quality";
import { buildKeyStringFromExam, normalizeStudentAnswers } from "@/lib/exams/exam-evaluate";
import { getResolvedExamMatrix } from "@/lib/exams/exam-matrix";
import { getExamLayout } from "@/lib/exams/exam-layout";
import { repairUtf8Mojibake } from "@/lib/exams/matrix-resolve";
import type { ExamResultRow, MergedExam } from "@/lib/exams/types";

export type SubjectGaugeMode = "matrix" | "layout" | "summary";

export type SubjectGaugeRow = { name: string; rate: number };

export type SubjectGaugesResult = {
  gauges: SubjectGaugeRow[];
  mode: SubjectGaugeMode;
};

/** Matrix soru→konu + optik — gerçek ders doğruluk oranları */
function buildFromMatrixAndKey(
  exam: MergedExam,
  examRows: ExamResultRow[]
): SubjectGaugeRow[] {
  const layout = getExamLayout(exam.sinav);
  const keyStr = buildKeyStringFromExam(exam, layout.n);
  if (!keyStr.replace(/\s/g, "").length) return [];

  const mx = getResolvedExamMatrix(exam.id);
  if (!mx?.questions?.length) return [];

  const bySubject: Record<string, { correct: number; total: number }> = {};

  examRows.forEach((r) => {
    const ans = normalizeStudentAnswers(r.answers, layout.n);
    for (let i = 0; i < layout.n; i++) {
      const kc = keyStr.charAt(i)?.trim();
      if (!kc || kc === " ") continue;
      const q = mx.questions.find((x) => x.qNo === i + 1);
      const sub = repairUtf8Mojibake(q?.subjectName || "Genel");
      if (!bySubject[sub]) bySubject[sub] = { correct: 0, total: 0 };
      bySubject[sub].total++;
      const ac = ans.charAt(i) || "";
      if (ac && ac !== " " && ac === kc) bySubject[sub].correct++;
    }
  });

  return Object.entries(bySubject)
    .map(([name, v]) => ({
      name,
      rate: v.total ? Math.round((1000 * v.correct) / v.total) / 10 : 0,
    }))
    .sort((a, b) => b.rate - a.rate);
}

/** Sınavdaki gerçek sonuçlardan branş/ders doğruluk oranları (layout blokları). */
export function buildSubjectGaugesFromLayout(
  exam: MergedExam,
  examRows: ExamResultRow[]
): SubjectGaugeRow[] {
  if (!examRows.length) return [];

  const layout = getExamLayout(exam.sinav);
  const keyStr = buildKeyStringFromExam(exam, layout.n);
  const sections = layout.sections || [];
  if (!sections.length) return [];

  const bySection: Record<string, { correct: number; total: number }> = {};
  sections.forEach((sec) => {
    bySection[sec.title] = { correct: 0, total: 0 };
  });

  const hasKey = keyStr.replace(/\s/g, "").length > 0;

  examRows.forEach((r) => {
    if (hasKey) {
      const ans = normalizeStudentAnswers(r.answers, layout.n);
      sections.forEach((sec) => {
        for (let i = sec.startQ - 1; i < sec.endQ; i++) {
          const kc = keyStr.charAt(i)?.trim();
          if (!kc || kc === " ") continue;
          const ac = ans.charAt(i) || "";
          bySection[sec.title]!.total++;
          if (ac && ac !== " " && ac === kc) bySection[sec.title]!.correct++;
        }
      });
    } else {
      const c = Number(r.correct) || 0;
      const w = Number(r.wrong) || 0;
      const b = Number(r.blank) || 0;
      const tot = c + w + b;
      if (!tot) return;
      const first = sections[0]?.title || "Genel";
      if (!bySection[first]) bySection[first] = { correct: 0, total: 0 };
      bySection[first].correct += c;
      bySection[first].total += tot;
    }
  });

  return Object.entries(bySection)
    .map(([name, v]) => ({
      name,
      rate: v.total ? Math.round((1000 * v.correct) / v.total) / 10 : 0,
    }))
    .filter((g) => g.rate > 0 || examRows.length > 0)
    .sort((a, b) => b.rate - a.rate);
}

/** Tab1 ders göstergeleri — matrix > layout > D/Y/B özeti */
export function buildSubjectGaugesForExam(
  exam: MergedExam,
  examRows: ExamResultRow[],
  opts?: { avgNet?: number; enrollmentTotal?: number }
): SubjectGaugesResult {
  if (!examRows.length) return { gauges: [], mode: "summary" };

  const matrixGauges = buildFromMatrixAndKey(exam, examRows);
  if (matrixGauges.length && matrixHasTopicLabels(exam.id)) {
    return { gauges: matrixGauges, mode: "matrix" };
  }

  const layoutGauges = buildSubjectGaugesFromLayout(exam, examRows);
  const keyStr = buildKeyStringFromExam(exam, getExamLayout(exam.sinav).n);
  if (layoutGauges.length && keyStr.replace(/\s/g, "").length > 0) {
    return { gauges: layoutGauges, mode: "layout" };
  }

  let totC = 0;
  let totW = 0;
  let totB = 0;
  examRows.forEach((r) => {
    totC += Number(r.correct) || 0;
    totW += Number(r.wrong) || 0;
    totB += Number(r.blank) || 0;
  });

  return {
    gauges: buildDyBSummaryGauges({
      correct: totC,
      wrong: totW,
      blank: totB,
      avgNet: opts?.avgNet ?? 0,
      studentCount: examRows.length,
      enrollmentTotal: opts?.enrollmentTotal ?? examRows.length,
    }),
    mode: "summary",
  };
}

/** @deprecated buildSubjectGaugesForExam kullanın */
export function buildSubjectGaugesFromResults(
  exam: MergedExam,
  examRows: ExamResultRow[]
): SubjectGaugeRow[] {
  return buildSubjectGaugesForExam(exam, examRows).gauges;
}

export { isDyBSummaryGaugeName };
