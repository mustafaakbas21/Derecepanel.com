import { describe, expect, it } from "vitest";

import { evaluateRow } from "@/lib/exams/exam-evaluate";

describe("evaluateRow", () => {
  it("computes net 37.5 for 40D 10Y", () => {
    const key = "A".repeat(50);
    const wrong = "B".repeat(10);
    const correct = "A".repeat(40);
    const answers = correct + wrong;
    const res = evaluateRow(answers, key);
    expect(res.correct).toBe(40);
    expect(res.wrong).toBe(10);
    expect(res.net).toBe(37.5);
  });

  it("returns null net without key", () => {
    const res = evaluateRow("ABCDE", null);
    expect(res.net).toBeNull();
  });
});
