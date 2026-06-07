import type { ExamResultRow } from "@/lib/exams/types";

/** Puan öncelikli; yoksa net */
export function scoreForRank(r: ExamResultRow): number {
  const p = Number(r?.puan);
  if (!Number.isNaN(p) && r.puan !== "" && r.puan != null) return p;
  const n = Number(r?.net);
  return Number.isNaN(n) ? 0 : n;
}

export function sortByScoreDesc(rows: ExamResultRow[]): ExamResultRow[] {
  return [...rows].sort((a, b) => {
    const pa = scoreForRank(a);
    const pb = scoreForRank(b);
    if (pb !== pa) return pb - pa;
    const na = Number(a.net) || 0;
    const nb = Number(b.net) || 0;
    if (nb !== na) return nb - na;
    return String(a.studentCode || a.studentId || "").localeCompare(
      String(b.studentCode || b.studentId || ""),
      "tr"
    );
  });
}
