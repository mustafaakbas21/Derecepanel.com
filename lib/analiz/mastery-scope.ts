import { findExamById } from "@/lib/exams/exam-storage";
import type { SinavTipi } from "@/lib/exams/types";

export function getSinavForExamId(examId: string): SinavTipi | null {
  const ex = findExamById(String(examId || "").trim());
  return ex?.sinav ?? null;
}

/** `sinav` verilmezse tüm sınavlar dahil */
export function examMatchesSinavScope(
  examId: string,
  sinav?: SinavTipi | null
): boolean {
  if (!sinav) return true;
  return getSinavForExamId(examId) === sinav;
}

export function sinavScopeLabel(sinav?: SinavTipi | null): string {
  if (sinav === "TYT") return "TYT";
  if (sinav === "AYT") return "AYT";
  if (sinav === "YDT") return "YDT";
  return "Tüm sınav";
}
