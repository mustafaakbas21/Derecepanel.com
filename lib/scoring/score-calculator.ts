/** Port: utils/score-calculator.js — YKS puan tek kaynak */

export const SCORE_CONSTANTS = {
  TYT_BASE: 100,
  TYT_TURKCE: 3.3,
  TYT_MAT: 3.3,
  TYT_SOSYAL: 3.4,
  TYT_FEN: 3.4,
  NET_WRONG_PENALTY: 4,
  PLACE_TYT_W: 0.4,
  PLACE_AYT_W: 0.6,
  OBP_FACTOR: 0.12,
  OBP_PLACED_HALF: 0.5,
} as const;

export const TYT_COEFF = {
  BASE: SCORE_CONSTANTS.TYT_BASE,
  TURKCE: SCORE_CONSTANTS.TYT_TURKCE,
  MAT: SCORE_CONSTANTS.TYT_MAT,
  SOSYAL: SCORE_CONSTANTS.TYT_SOSYAL,
  FEN: SCORE_CONSTANTS.TYT_FEN,
  NET_WRONG_PENALTY: SCORE_CONSTANTS.NET_WRONG_PENALTY,
} as const;

function toNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function roundTo(n: number, digits = 3): number {
  const pow = 10 ** digits;
  return Math.round((toNum(n) + Number.EPSILON) * pow) / pow;
}

export function fmtFixed(n: number, digits = 3): string {
  if (!Number.isFinite(n)) return "—";
  return roundTo(n, digits).toFixed(digits);
}

export function parseDynHyphen(str: string): { d: number; y: number; n: number } {
  const p = String(str || "").split("-");
  return {
    d: Number(p[0]) || 0,
    y: Number(p[1]) || 0,
    n: Number(p[2]) || 0,
  };
}

export function netFromDyn(dyn: { d: number; y: number }): number {
  return dyn.d - dyn.y / SCORE_CONSTANTS.NET_WRONG_PENALTY;
}

export function netFromCorrectWrong(d: number, y: number): number {
  return toNum(d) - toNum(y) / SCORE_CONSTANTS.NET_WRONG_PENALTY;
}

export function weightedSum(items: { net: number; weight: number; has?: boolean }[]): {
  sum: number;
  has: boolean;
} {
  let sum = 0;
  let has = false;
  for (const it of items) {
    if (it.has !== false && (it.has || Number.isFinite(it.net))) has = true;
    sum += toNum(it.net) * toNum(it.weight);
  }
  return { sum, has };
}

export function score100Plus(block: { sum: number; has: boolean }): number {
  return SCORE_CONSTANTS.TYT_BASE + (block.has ? toNum(block.sum) : 0);
}

export function placementScore(
  tytScore: number,
  aytScore: number,
  obpContribution: number
): number {
  return (
    toNum(tytScore) * SCORE_CONSTANTS.PLACE_TYT_W +
    toNum(aytScore) * SCORE_CONSTANTS.PLACE_AYT_W +
    toNum(obpContribution)
  );
}

export function calculateTYTScore(
  turkceNet: number,
  sosyalNet: number,
  matematikNet: number,
  fenNet: number
): number {
  return (
    SCORE_CONSTANTS.TYT_BASE +
    turkceNet * SCORE_CONSTANTS.TYT_TURKCE +
    sosyalNet * SCORE_CONSTANTS.TYT_SOSYAL +
    matematikNet * SCORE_CONSTANTS.TYT_MAT +
    fenNet * SCORE_CONSTANTS.TYT_FEN
  );
}

export function calculateTYTScoreFromFourAreasStrings(four: {
  turk: string;
  sosyal: string;
  mat: string;
  fen: string;
}): number {
  const t = netFromDyn(parseDynHyphen(four.turk));
  const s = netFromDyn(parseDynHyphen(four.sosyal));
  const m = netFromDyn(parseDynHyphen(four.mat));
  const f = netFromDyn(parseDynHyphen(four.fen));
  return calculateTYTScore(t, s, m, f);
}

export function obpContribution(
  diplomaNotu: number,
  yerlesenKatsayi = false
): number {
  const base = toNum(diplomaNotu) * 5 * SCORE_CONSTANTS.OBP_FACTOR;
  return yerlesenKatsayi ? base * SCORE_CONSTANTS.OBP_PLACED_HALF : base;
}

/** Legacy window.ScoreCalculator uyumlu nesne */
export const ScoreCalculator = {
  constants: SCORE_CONSTANTS,
  roundTo,
  fmtFixed,
  parseDynHyphen,
  netFromDyn,
  netFromCorrectWrong,
  weightedSum,
  score100Plus,
  placementScore,
  calculateTYTScore,
  calculateTYTScoreFromFourAreasStrings,
  obpContribution,
};
