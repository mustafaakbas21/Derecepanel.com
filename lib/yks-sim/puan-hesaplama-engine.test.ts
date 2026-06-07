import { describe, expect, it } from "vitest";

import { createEmptyRowInputs } from "@/lib/yks-sim/puan-hesaplama-config";
import {
  clampRowInput,
  computePuanHesaplama,
  hamPayloadFromOutputs,
  parseRowInput,
  pickPrimaryTipi,
  tytScoreFromRows,
} from "@/lib/yks-sim/puan-hesaplama-engine";
import { fmtFixed, netFromCorrectWrong, obpContribution } from "@/lib/scoring/score-calculator";
import { estimateRankFromCurve } from "@/lib/scoring/rank-curves";

describe("parseRowInput", () => {
  it("computes net 30D 10Y as 27.5", () => {
    const r = parseRowInput({ d: "30", y: "10" }, 40);
    expect(r.has).toBe(true);
    expect(r.net).toBe(27.5);
    expect(r.invalid).toBe(false);
  });

  it("flags invalid when d+y exceeds maxQ", () => {
    const r = parseRowInput({ d: "30", y: "15" }, 40);
    expect(r.invalid).toBe(true);
    expect(r.d + r.y).toBeLessThanOrEqual(40);
  });

  it("clampRowInput limits AYT mat to 40 questions", () => {
    const c = clampRowInput({ d: "35", y: "12" }, 40);
    expect(parseInt(c.d, 10)).toBe(35);
    expect(parseInt(c.y, 10)).toBe(5);
  });
});

describe("OGM / DerecePanel puan modeli", () => {
  it("TYT only: ham = 100 + 30×3,3, yerleştirme = ham + OBP", () => {
    const rows = createEmptyRowInputs();
    rows["tyt-tr"] = { d: "30", y: "" };
    const out = computePuanHesaplama({ rows, diploma: "80", yerlesenHalf: false });
    const expectedHam = 100 + 30 * 3.3;
    expect(out.ham.TYT).toBeCloseTo(expectedHam, 3);
    expect(out.lines.TYT.value).toBeCloseTo(expectedHam + out.obp, 3);
  });

  it("OBP = diploma × 5 × 0,12", () => {
    const rows = createEmptyRowInputs();
    rows["tyt-tr"] = { d: "10", y: "" };
    const out = computePuanHesaplama({ rows, diploma: "80", yerlesenHalf: false });
    expect(out.obp).toBeCloseTo(obpContribution(80, false), 3);
  });

  it("SAY uses soru bazlı matris (TYT+AYT katsayıları) + OBP", () => {
    const rows = createEmptyRowInputs();
    rows["tyt-tr"] = { d: "30", y: "" };
    rows["ayt-mat"] = { d: "20", y: "" };
    const out = computePuanHesaplama({ rows, diploma: "0", yerlesenHalf: false });

    const expectedHam = 100 + 30 * 1.32 + 20 * 3.0;

    expect(out.ham.SAY).toBeCloseTo(expectedHam, 3);
    expect(out.lines.SAY.value).toBeCloseTo(expectedHam, 3);
  });

  it("clears to empty outputs", () => {
    const rows = createEmptyRowInputs();
    const out = computePuanHesaplama({ rows, diploma: "", yerlesenHalf: false });
    expect(out.lines.TYT.value).toBeNull();
    expect(out.lines.SAY.value).toBeNull();
    expect(out.yer.TYT).toBeNull();
  });
});

describe("tytScoreFromRows", () => {
  it("TYT ham uses 3,3 / 3,4 coefficients", () => {
    const rows = createEmptyRowInputs();
    rows["tyt-tr"] = { d: "30", y: "" };
    const tyt = tytScoreFromRows(rows);
    expect(tyt.has).toBe(true);
    expect(tyt.score).toBeCloseTo(100 + 30 * 3.3, 2);
  });
});

describe("pickPrimaryTipi", () => {
  it("picks highest placement score type", () => {
    const yer = {
      TYT: 300,
      SAY: 420,
      EA: 380,
      SÖZ: null,
      DİL: null,
    };
    expect(pickPrimaryTipi(yer)).toBe("SAY");
  });
});

describe("netFromCorrectWrong", () => {
  it("31D 9Y = 28.75", () => {
    expect(netFromCorrectWrong(31, 9)).toBe(28.75);
  });
});

describe("estimateRankFromCurve", () => {
  it("interpolates between curve points", () => {
    const r = estimateRankFromCurve("SAY", 300);
    expect(r).not.toBeNull();
    expect(r!).toBeGreaterThan(0);
  });
});

describe("hamPayloadFromOutputs", () => {
  it("returns null for unused blocks", () => {
    const rows = createEmptyRowInputs();
    rows["tyt-tr"] = { d: "10", y: "" };
    const out = computePuanHesaplama({ rows, diploma: "80", yerlesenHalf: false });
    const ham = hamPayloadFromOutputs(out);
    expect(ham.tyt).not.toBeNull();
    expect(ham.say).toBeNull();
  });
});

describe("fmtFixed", () => {
  it("matches 3 decimal places", () => {
    expect(fmtFixed(387.125, 3)).toBe("387.125");
  });
});
