import { computeStudentQuestionResults } from "@/lib/analiz/question-results";
import { computeClassQuestionRates } from "@/lib/analiz/class-question-rates";
import { getAnswerKeyForExamId } from "@/lib/analiz/hydrate";
import { readAnalizExamResults } from "@/lib/analiz/exam-results-source";

export type QuestionResultCell = {
  qNo: number;
  result: "correct" | "wrong" | "empty";
  subjectName: string;
  topicName: string;
  subjectId?: string;
  topicId?: string;
  classRate: number;
};

export function getStudentExamQuestionCells(
  examId: string,
  studentId: string,
  classRates: Record<number, number>
): QuestionResultCell[] {
  const key = getAnswerKeyForExamId(examId);
  const cells = computeStudentQuestionResults(examId, studentId, key);
  return cells.map((c) => ({
    qNo: c.qNo,
    result: c.result,
    subjectName: c.subjectName,
    topicName: c.topicName,
    subjectId: c.subjectId,
    topicId: c.topicId,
    classRate: classRates[c.qNo] ?? 0,
  }));
}

/** Sınıf soru doğruluk oranları — heatmap / öncelik için */
export function buildClassRatesMap(examId: string): Record<number, number> {
  const key = getAnswerKeyForExamId(examId);
  const rows = computeClassQuestionRates(examId, readAnalizExamResults(), key);
  const m: Record<number, number> = {};
  rows.forEach((r) => {
    m[r.qNo] = r.classCorrectRate;
  });
  return m;
}

export function heatmapColor(rate: number): string {
  if (rate < 40) return "bg-red-500 text-white";
  if (rate < 70) return "bg-amber-400 text-slate-900";
  return "bg-emerald-500 text-white";
}
