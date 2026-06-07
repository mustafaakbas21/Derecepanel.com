import { describe, expect, it } from "vitest";

import type { StudentQuestionResult } from "@/lib/analiz/question-results";

/** aggregateResults mantığını doğrula — modül içi davranış */
function aggregateLike(results: StudentQuestionResult[]) {
  const acc: Record<string, { correct: number; wrong: number; empty: number; total: number }> =
    {};
  results.forEach((r) => {
    const sub = r.subjectName;
    if (!acc[sub]) acc[sub] = { correct: 0, wrong: 0, empty: 0, total: 0 };
    acc[sub].total++;
    if (r.result === "correct") acc[sub].correct++;
    else if (r.result === "wrong") acc[sub].wrong++;
    else acc[sub].empty++;
  });
  return Object.entries(acc).map(([name, v]) => ({
    name,
    rate: Math.round((1000 * v.correct) / v.total) / 10,
    ...v,
  }));
}

describe("last exam subject aggregation", () => {
  it("counts per subject correct and wrong", () => {
    const rows: StudentQuestionResult[] = [
      { qNo: 1, result: "wrong", subjectName: "TYT Matematik", topicName: "Problemler" },
      { qNo: 2, result: "wrong", subjectName: "TYT Matematik", topicName: "Problemler" },
      { qNo: 3, result: "correct", subjectName: "TYT Matematik", topicName: "Problemler" },
      { qNo: 4, result: "correct", subjectName: "TYT Türkçe", topicName: "Paragraf" },
      { qNo: 5, result: "wrong", subjectName: "TYT Türkçe", topicName: "Paragraf" },
    ];
    const out = aggregateLike(rows);
    const mat = out.find((x) => x.name === "TYT Matematik");
    expect(mat?.total).toBe(3);
    expect(mat?.correct).toBe(1);
    expect(mat?.wrong).toBe(2);
    expect(mat?.rate).toBeCloseTo(33.3, 0);
  });
});
