import { NextResponse } from "next/server";

import { AuthError, requireCoachAuth } from "@/lib/auth/require-coach-server";
import {
  computeKpiStats,
  readCoachScopedExamResults,
} from "@/lib/exams/exam-results-storage";
import { loadMergedExams } from "@/lib/exams/exam-storage";
import { computeResultsAgg, countExamsWithResults } from "@/lib/exams/results-agg";

export async function GET(request: Request) {
  try {
    await requireCoachAuth(request);
    const results = readCoachScopedExamResults();
    const exams = loadMergedExams();
    const agg = computeResultsAgg(results);
    const kpis = computeKpiStats(
      results,
      exams.length,
      countExamsWithResults(agg)
    );
    return NextResponse.json({ kpis, agg });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
