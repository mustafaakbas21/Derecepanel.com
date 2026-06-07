import { describe, expect, it } from "vitest";

import { rowFourAreas } from "@/lib/scoring/four-areas";
import { calculateTYTScoreFromFourAreasStrings } from "@/lib/scoring/score-calculator";
import { computeRankMeta, studentRowKey } from "@/lib/exams/exam-rank";
import { sortByScoreDesc, scoreForRank } from "@/lib/scoring/rankings";
import { getExamLayout } from "@/lib/exams/exam-layout";
import type { ExamResultRow, MergedExam } from "@/lib/exams/types";
import {
  buildVeliMessage,
  normalizeTurkPhone,
} from "@/lib/messaging/whatsapp-veli";

describe("normalizeTurkPhone", () => {
  it("normalizes 05xx to 90", () => {
    expect(normalizeTurkPhone("0532 111 22 33")).toBe("905321112233");
  });
  it("normalizes 5xx without leading 0", () => {
    expect(normalizeTurkPhone("5321112233")).toBe("905321112233");
  });
});

describe("sortByScoreDesc", () => {
  it("prefers puan over net", () => {
    const rows: ExamResultRow[] = [
      {
        examId: "e1",
        studentId: "a",
        answers: "",
        net: 90,
        savedAt: "",
      },
      {
        examId: "e1",
        studentId: "b",
        answers: "",
        net: 50,
        puan: "350.500",
        savedAt: "",
      },
    ];
    const sorted = sortByScoreDesc(rows);
    expect(sorted[0].studentId).toBe("b");
    expect(scoreForRank(rows[1]!)).toBeGreaterThan(scoreForRank(rows[0]!));
  });

  it("tie-breaks by studentCode", () => {
    const rows: ExamResultRow[] = [
      {
        examId: "e1",
        studentId: "a",
        studentCode: "B002",
        answers: "",
        net: 80,
        savedAt: "",
      },
      {
        examId: "e1",
        studentId: "b",
        studentCode: "A001",
        answers: "",
        net: 80,
        savedAt: "",
      },
    ];
    const sorted = sortByScoreDesc(rows);
    expect(sorted[0].studentCode).toBe("A001");
  });
});

describe("computeRankMeta", () => {
  it("assigns genel and sube ranks", () => {
    const rows: ExamResultRow[] = [
      {
        examId: "e1",
        studentId: "1",
        answers: "",
        net: 90,
        sube: "A",
        savedAt: "",
      },
      {
        examId: "e1",
        studentId: "2",
        answers: "",
        net: 70,
        sube: "A",
        savedAt: "",
      },
      {
        examId: "e1",
        studentId: "3",
        answers: "",
        net: 80,
        sube: "B",
        savedAt: "",
      },
    ];
    const meta = computeRankMeta(rows);
    expect(meta.genel[studentRowKey(rows[0]!)]).toBe(1);
    expect(meta.sinif[studentRowKey(rows[1]!)]).toBe(2);
    expect(meta.total).toBe(3);
  });
});

describe("rowFourAreas", () => {
  it("returns note when no answer key", () => {
    const exam: MergedExam = {
      id: "e1",
      ad: "T",
      name: "T",
      date: "2026-01-01",
      tarih: "2026-01-01",
      saat: "09:00",
      sinav: "TYT",
      soruSayisi: 120,
      cevaplar: [],
      zorluk: [],
      konu: [],
      konuYazi: [],
      isGlobal: false,
    };
    const layout = getExamLayout("TYT");
    const rec: ExamResultRow = {
      examId: "e1",
      studentId: "s1",
      answers: "",
      correct: 10,
      wrong: 5,
      blank: 5,
      savedAt: "",
    };
    const four = rowFourAreas(rec, exam, layout, " ".repeat(120));
    expect(four.note).toBe(true);
  });
});

describe("calculateTYTScore", () => {
  it("computes from four area strings", () => {
    const score = calculateTYTScoreFromFourAreasStrings({
      turk: "30-5-28.75",
      sosyal: "10-2-9.5",
      mat: "35-8-33",
      fen: "15-3-14.25",
    });
    expect(score).toBeGreaterThan(100);
  });
});

describe("buildVeliMessage", () => {
  it("includes student and exam", () => {
    const msg = buildVeliMessage("Ali", "Mart TYT", "85.5", "https://test.com");
    expect(msg).toContain("Ali");
    expect(msg).toContain("Mart TYT");
    expect(msg).toContain("85.5");
  });
});
