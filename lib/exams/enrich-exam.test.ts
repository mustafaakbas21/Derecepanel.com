import { describe, expect, it } from "vitest";

import { computeMatrixPct } from "@/lib/exams/exam-evaluate";
import { deriveDurum, enrichKurumDeneme, isPdfYuklu } from "@/lib/exams/enrich-exam";
import { getExamLayout, getExamQuestionCount } from "@/lib/exams/exam-layout";
import type { KurumDeneme } from "@/lib/exams/types";

describe("getExamLayout", () => {
  it("TYT 120, AYT 160, YDT 80", () => {
    expect(getExamLayout("TYT").n).toBe(120);
    expect(getExamLayout("AYT").n).toBe(160);
    expect(getExamLayout("YDT").n).toBe(80);
    expect(getExamQuestionCount("TYT")).toBe(120);
  });
});

describe("computeMatrixPct", () => {
  it("counts filled A–E answers", () => {
    const cevaplar = ["A", "", "B", "C"];
    expect(computeMatrixPct(cevaplar, 4)).toBe(75);
    expect(computeMatrixPct(cevaplar, 8)).toBe(38);
  });
});

describe("deriveDurum", () => {
  it("tamamlandi when explicit", () => {
    expect(deriveDurum(50, false, "tamamlandi")).toBe("tamamlandi");
  });
  it("aktif when matrix full and pdf", () => {
    expect(deriveDurum(100, true)).toBe("aktif");
  });
  it("taslak otherwise", () => {
    expect(deriveDurum(100, false)).toBe("taslak");
    expect(deriveDurum(80, true)).toBe("taslak");
  });
});

describe("enrichKurumDeneme", () => {
  it("computes matrixPct and durum", () => {
    const base: KurumDeneme = {
      id: "kd-test",
      ad: "Test",
      tarih: "2026-05-28",
      saat: "09:00",
      sinav: "TYT",
      soruSayisi: 4,
      cevaplar: ["A", "B", "C", "D"],
      zorluk: ["2", "2", "2", "2"],
      konu: ["", "", "", ""],
      konuYazi: ["", "", "", ""],
      pdfUrl: "data:application/pdf;base64,x",
      scope: "kurumsal",
      institutionId: "inst-default",
    };
    const out = enrichKurumDeneme(base);
    expect(out.matrixPct).toBe(100);
    expect(out.durum).toBe("aktif");
    expect(isPdfYuklu(out)).toBe(true);
  });
});
