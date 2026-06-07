import { NextResponse } from "next/server";

import { computeOnyxInsights } from "@/lib/db/insights";
import { listQuestionMemoryByStudent } from "@/lib/db/question-memory";

/** Koç Insight API — son 7 gün zorluk ortalaması + zorlanılan konular */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId")?.trim();
  if (!studentId) {
    return NextResponse.json(
      { error: "studentId query parametresi gerekli" },
      { status: 400 }
    );
  }

  const periodDays = Math.min(
    30,
    Math.max(1, Number(searchParams.get("days")) || 7)
  );

  const [insights, struggled] = await Promise.all([
    computeOnyxInsights(studentId, periodDays),
    listQuestionMemoryByStudent(studentId, {
      since: new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000),
      limit: 20,
    }),
  ]);

  return NextResponse.json({
    ...insights,
    struggledQuestions: struggled.map((r) => ({
      id: r.id,
      topic: r.topic,
      difficultyScore: r.difficultyScore,
      timestamp: r.timestamp,
      hasImage: Boolean(r.questionImage),
      solutionPreview: r.solutionText.slice(0, 160),
    })),
  });
}
