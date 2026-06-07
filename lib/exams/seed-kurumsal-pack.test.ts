import { describe, expect, it } from "vitest";

import {
  buildSeedExamMatrices,
  generateStudentAnswersForKey,
  studentSeedAccuracy,
} from "@/lib/exams/seed-kurumsal-pack";
import { computeMatrixPct, evaluateRow } from "@/lib/exams/exam-evaluate";
import { getExamQuestionCount } from "@/lib/exams/exam-layout";

describe("buildSeedExamMatrices", () => {
  it("TYT matris %100 dolu", () => {
    const m = buildSeedExamMatrices("TYT", 42);
    expect(m.soruSayisi).toBe(120);
    expect(m.cevaplar).toHaveLength(120);
    expect(m.konu.filter((k) => String(k).trim()).length).toBe(120);
    expect(computeMatrixPct(m.cevaplar, 120)).toBe(100);
  });

  it("AYT 160 soru", () => {
    const m = buildSeedExamMatrices("AYT", 7);
    expect(m.soruSayisi).toBe(getExamQuestionCount("AYT"));
    expect(m.konuYazi.every((y) => String(y).length > 0)).toBe(true);
  });
});

describe("generateStudentAnswersForKey", () => {
  it("yüksek doğruluk ortalama neti artırır", () => {
    const key = "ABCDE".repeat(24).slice(0, 120);
    let hiSum = 0;
    let loSum = 0;
    for (let s = 0; s < 12; s++) {
      hiSum += evaluateRow(generateStudentAnswersForKey(key, 0.92, s * 17), key).net ?? 0;
      loSum += evaluateRow(generateStudentAnswersForKey(key, 0.52, s * 31 + 9), key).net ?? 0;
    }
    expect(hiSum / 12).toBeGreaterThan(loSum / 12);
  });

  it("studentSeedAccuracy aralığı makul", () => {
    const acc = studentSeedAccuracy(
      {
        ogrenciId: "st-1",
        coachId: "c",
        name: "Test",
        studentCode: "T1",
        sinifBranch: "12",
        alan: "sayisal",
        goal: "x",
        kayitDate: "2025-01-01",
        status: "aktif",
        parent: "p",
        parentPhone: "5",
      },
      2
    );
    expect(acc).toBeGreaterThanOrEqual(0.5);
    expect(acc).toBeLessThanOrEqual(0.87);
  });
});
