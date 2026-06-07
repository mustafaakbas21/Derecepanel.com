import { describe, expect, it } from "vitest";

import { getExamLayout, getExamQuestionCount } from "@/lib/exams/exam-layout";

describe("getExamLayout", () => {
  it("TYT has 120 questions", () => {
    expect(getExamQuestionCount("TYT")).toBe(120);
    expect(getExamLayout("TYT").n).toBe(120);
  });

  it("AYT has 160 questions", () => {
    expect(getExamQuestionCount("AYT")).toBe(160);
  });

  it("YDT has 80 questions", () => {
    expect(getExamQuestionCount("YDT")).toBe(80);
  });
});
