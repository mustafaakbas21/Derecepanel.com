/**
 * Analiz & Sonuç Merkezi — tek sonuç kaynağı (kurumsal/global yüklemeden gelen examResults).
 * Sonuç Merkezi ile aynı: koç filtresi açıksa yalnızca o koçun öğrencileri.
 */
import { readCoachScopedExamResults } from "@/lib/exams/exam-results-storage";

export { readCoachScopedExamResults, resultsForExam } from "@/lib/exams/exam-results-storage";

export function readAnalizExamResults() {
  return readCoachScopedExamResults();
}
