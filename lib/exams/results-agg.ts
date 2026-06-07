import type { ExamResultRow } from "@/lib/exams/types";

export type ResultsAggEntry = { count: number; sumNet: number };

export function computeResultsAgg(results: ExamResultRow[]): Record<string, ResultsAggEntry> {
  const agg: Record<string, ResultsAggEntry> = {};
  for (const r of results) {
    if (!r?.examId) continue;
    const id = String(r.examId);
    if (!agg[id]) agg[id] = { count: 0, sumNet: 0 };
    agg[id].count += 1;
    agg[id].sumNet += Number(r.net) || 0;
  }
  return agg;
}

export function aggAvgNet(st: ResultsAggEntry | undefined): string {
  if (!st?.count) return "—";
  return (st.sumNet / st.count).toFixed(1);
}

export function countExamsWithResults(agg: Record<string, ResultsAggEntry>): number {
  return Object.values(agg).filter((x) => x.count > 0).length;
}
