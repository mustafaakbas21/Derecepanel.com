import { loadMergedExams } from "@/lib/exams/exam-storage";
import { resultsForExam as resultsForExamStorage } from "@/lib/exams/exam-results-storage";
import type { ExamResultRow } from "@/lib/exams/types";

export { loadMergedExams };

export function resultsForExam(examId: string): ExamResultRow[] {
  return resultsForExamStorage(examId);
}

export function sortByNetDesc(rows: ExamResultRow[]): ExamResultRow[] {
  return rows.slice().sort((a, b) => {
    const na = Number(a.net) || 0;
    const nb = Number(b.net) || 0;
    if (nb !== na) return nb - na;
    const ca = String(a.studentCode || a.studentId || "");
    const cb = String(b.studentCode || b.studentId || "");
    return ca.localeCompare(cb, "tr");
  });
}

export function findExam<T extends { id: string }>(exams: T[], id: string): T | null {
  const sid = String(id || "");
  return exams.find((e) => e && String(e.id) === sid) ?? null;
}
