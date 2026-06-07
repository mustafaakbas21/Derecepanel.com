import {
  readCoachScopedExamResults,
  readExamResults,
  resultsForExam,
} from "@/lib/exams/exam-results-storage";
import { shouldFilterByCoach } from "@/lib/exams/coach-scope";
import type { ExamResultRow } from "@/lib/exams/types";

/** Karne / sıralama — Sonuç Merkezi ile aynı havuz (koç filtresi dahil) */
export function readSonucMerkeziResultsPool(): ExamResultRow[] {
  return shouldFilterByCoach() ? readCoachScopedExamResults() : readExamResults();
}

export function resultsForExamInPool(examId: string): ExamResultRow[] {
  return resultsForExam(examId, shouldFilterByCoach());
}

export function findExamResultRow(
  examId: string,
  studentKey: string
): ExamResultRow | undefined {
  const key = String(studentKey || "").trim();
  if (!key) return undefined;
  const rows = resultsForExamInPool(examId).filter(
    (r) => String(r.studentId) === key || String(r.studentCode) === key
  );
  return rows.sort((a, b) =>
    String(b.savedAt || "").localeCompare(String(a.savedAt || ""))
  )[0];
}
