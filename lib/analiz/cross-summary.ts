import { examMatchesSinavScope } from "@/lib/analiz/mastery-scope";
import type { SubjectMasteryRow } from "@/lib/analiz/subject-mastery";
import type { SinavTipi } from "@/lib/exams/types";
import { readJsonArray } from "@/lib/exams/local-storage";

export type CrossMasterySummary = {
  examCount: number;
  correct: number;
  wrong: number;
  empty: number;
  avgRate: number;
};

type MatrixResultRow = {
  examId: string;
  studentId: string;
  answers: { qNo: number; result: string }[];
};

/** Tab5 üst badge'ler + sınav sayısı */
export function summarizeCrossMastery(
  studentId: string,
  rows: SubjectMasteryRow[],
  options?: { sinav?: SinavTipi | null }
): CrossMasterySummary {
  const sid = String(studentId);
  const sinav = options?.sinav ?? null;
  const matrixResults = readJsonArray<MatrixResultRow>("derece_exam_results_matrix_v1").filter(
    (r) =>
      r &&
      String(r.studentId) === sid &&
      examMatchesSinavScope(String(r.examId), sinav)
  );

  const examIds = new Set(matrixResults.map((r) => r.examId));
  let correct = 0;
  let wrong = 0;
  let empty = 0;

  matrixResults.forEach((res) => {
    (res.answers || []).forEach((a) => {
      if (a.result === "correct") correct++;
      else if (a.result === "wrong") wrong++;
      else if (a.result === "empty") empty++;
    });
  });

  if (!matrixResults.length && rows.length) {
    rows.forEach((r) => {
      correct += r.correct;
      wrong += r.wrong;
      empty += r.empty;
    });
  }

  const total = correct + wrong + empty;
  const avgRate = rows.length
    ? Math.round((rows.reduce((s, r) => s + r.rate, 0) / rows.length) * 10) / 10
    : total
      ? Math.round((1000 * correct) / total) / 10
      : 0;

  return {
    examCount: examIds.size || (rows.length > 0 ? 1 : 0),
    correct,
    wrong,
    empty,
    avgRate,
  };
}

/** Tab5 ders bazlı yatay bar */
export function aggregateCrossBySubject(rows: SubjectMasteryRow[]): { name: string; rate: number }[] {
  const acc: Record<string, { c: number; t: number }> = {};
  rows.forEach((r) => {
    const sub = r.subjectName || "Genel";
    if (!acc[sub]) acc[sub] = { c: 0, t: 0 };
    acc[sub].c += r.correct;
    acc[sub].t += r.total;
  });
  return Object.entries(acc)
    .map(([name, v]) => ({
      name,
      rate: v.t ? Math.round((1000 * v.c) / v.t) / 10 : 0,
    }))
    .sort((a, b) => b.rate - a.rate);
}
