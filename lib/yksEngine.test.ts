import { describe, expect, it } from "vitest";

import {
  calculateHamFromCoefficientMatrix,
  calculateNet,
  calculateOBP,
  calculateTYT,
  clampDiplomaGrade,
  computeYksScores,
  mapLegacyRowsToScoreInputs,
  SCORE_BASE,
} from "@/lib/yksEngine";

describe("calculateNet", () => {
  it("30D 10Y → 27.5", () => {
    expect(calculateNet(30, 10)).toBe(27.5);
  });

  it("allows negative net (ÖSYM test neti)", () => {
    expect(calculateNet(0, 4)).toBe(-1);
  });
});

describe("calculateOBP", () => {
  it("diploma 80 → 48", () => {
    expect(calculateOBP(80)).toBeCloseTo(80 * 5 * 0.12, 5);
  });

  it("yerleşen yarım OBP", () => {
    expect(calculateOBP(80, true)).toBeCloseTo(24, 5);
  });

  it("clamps diploma to 50–100", () => {
    expect(clampDiplomaGrade(40)).toBe(50);
    expect(clampDiplomaGrade(120)).toBe(100);
  });
});

describe("calculateTYT", () => {
  it("100 + 30×3.3 Türkçe", () => {
    const r = calculateTYT({
      turkce: { correct: 30, incorrect: 0 },
      matematik: { correct: 0, incorrect: 0 },
      sosyal: { correct: 0, incorrect: 0 },
      fen: { correct: 0, incorrect: 0 },
    });
    expect(r.ham).toBeCloseTo(100 + 30 * 3.3, 3);
  });
});

describe("calculateHamFromCoefficientMatrix (SAY)", () => {
  it("100 + TYT(30×1.32) + AYT Mat(20×3.0)", () => {
    const rowNets = { "tyt-tr": 30, "ayt-mat": 20 };
    const r = calculateHamFromCoefficientMatrix("SAY", rowNets);
    expect(r.ham).toBeCloseTo(100 + 30 * 1.32 + 20 * 3.0, 3);
  });
});

describe("computeYksScores", () => {
  it("SAY yerleştirme = matris ham + OBP", () => {
    const out = computeYksScores({
      tyt: {
        turkce: { correct: 30, incorrect: 0 },
        matematik: { correct: 0, incorrect: 0 },
        sosyal: { correct: 0, incorrect: 0 },
        fen: { correct: 0, incorrect: 0 },
      },
      ayt: {
        say: {
          matematik: { correct: 20, incorrect: 0 },
          fizik: { correct: 0, incorrect: 0 },
          kimya: { correct: 0, incorrect: 0 },
          biyoloji: { correct: 0, incorrect: 0 },
        },
      },
      diplomaGrade: 80,
    });

    const expectedHam = SCORE_BASE + 30 * 1.32 + 20 * 3.0;
    const expectedPlacement = expectedHam + calculateOBP(80);

    expect(out.hamByTur.SAY).toBeCloseTo(expectedHam, 3);
    expect(out.placementByTur.SAY).toBeCloseTo(expectedPlacement, 3);
    expect(out.hamByTur.TYT).toBeCloseTo(100 + 30 * 3.3, 3);
  });

  it("counts row with only wrong answers as input", () => {
    const out = computeYksScores({
      tyt: {
        turkce: { correct: 0, incorrect: 4 },
        matematik: { correct: 0, incorrect: 0 },
        sosyal: { correct: 0, incorrect: 0 },
        fen: { correct: 0, incorrect: 0 },
      },
      diplomaGrade: 0,
    });
    expect(out.tyt).not.toBeNull();
    expect(out.hamByTur.TYT).toBeCloseTo(100 - 1 * 3.3, 3);
  });
});

describe("mapLegacyRowsToScoreInputs", () => {
  it("maps tyt-tr row", () => {
    const s = mapLegacyRowsToScoreInputs(
      { "tyt-tr": { d: "10", y: "2" } },
      "85",
      false
    );
    expect(s.tyt.turkce.correct).toBe(10);
    expect(s.tyt.turkce.incorrect).toBe(2);
    expect(s.diplomaGrade).toBe(85);
  });
});
