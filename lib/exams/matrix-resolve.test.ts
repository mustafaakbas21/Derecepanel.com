import { describe, expect, it } from "vitest";

import type { ExamMatrixRecord } from "@/lib/exams/exam-matrix";
import { mergeExamMatrixWithPool } from "@/lib/exams/matrix-resolve";

function mx(
  examId: string,
  questions: ExamMatrixRecord["questions"]
): ExamMatrixRecord {
  return {
    examId,
    name: "Test",
    questionCount: questions.length,
    questions,
  };
}

describe("mergeExamMatrixWithPool", () => {
  it("prefers primary (takvim) topic over stale LS fallback", () => {
    const pool = mx("e1", [
      {
        qNo: 1,
        subjectId: "tyt-tr",
        subjectName: "TYT Türkçe",
        topicId: "t2",
        topicName: "Sözcükte Anlam",
      },
    ]);
    const stored = mx("e1", [
      {
        qNo: 1,
        subjectId: "tyt-tr",
        subjectName: "TYT Türkçe",
        topicId: "t1",
        topicName: "Paragraf",
      },
    ]);
    const merged = mergeExamMatrixWithPool(pool, stored)!;
    expect(merged.questions[0]?.topicName).toBe("Sözcükte Anlam");
  });

  it("fills from fallback when primary topic is weak", () => {
    const pool = mx("e1", [
      {
        qNo: 1,
        subjectId: "tyt-tr",
        subjectName: "TYT Türkçe",
        topicId: null,
        topicName: "Genel",
      },
    ]);
    const stored = mx("e1", [
      {
        qNo: 1,
        subjectId: "tyt-tr",
        subjectName: "TYT Türkçe",
        topicId: "t1",
        topicName: "Paragraf",
      },
    ]);
    const merged = mergeExamMatrixWithPool(pool, stored)!;
    expect(merged.questions[0]?.topicName).toBe("Paragraf");
  });
});
