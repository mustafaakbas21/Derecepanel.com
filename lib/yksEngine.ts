/**
 * YKS Puan Motoru v2 — ÖSYM soru bazlı çarpan matrisi (yerleştirme puanı)
 *
 * Yerleştirme ham = 100 + Σ(testNetᵢ × katsayıᵢ)   [puan türüne özel matris]
 * Yerleştirme     = ham + OBP
 *
 * TYT ham: yalnızca TYT testleri (3,3 / 3,3 / 3,4 / 3,4)
 * SAY/EA/SÖZ/DİL: aynı matriste TYT + ilgili AYT/YDT test katsayıları (0,4/0,6 ayrımı YOK)
 *
 * OBP: clamp(diploma, 50–100) × 5 × 0,12  (max 60); kırık OBP: × 0,06
 */

export const YKS_ENGINE_VERSION = "2.0.0" as const;

export const NET_WRONG_DIVISOR = 4;
export const SCORE_BASE = 100;
export const OBP_RATE = 0.12;
export const OBP_RATE_PLACED_PREVIOUSLY = 0.06;
export const DIPLOMA_MIN = 50;
export const DIPLOMA_MAX = 100;
export const OBP_MAX = DIPLOMA_MAX * 5 * OBP_RATE; // 60

/** TYT oturumu — ham TYT puanı */
export const TYT_SUBJECT_COEFFICIENTS = {
  turkce: 3.3,
  matematik: 3.3,
  sosyal: 3.4,
  fen: 3.4,
} as const;

/** Satır id → katsayı (yerleştirme puan türü matrisleri) */
export const PLACEMENT_COEFFICIENT_MATRIX = {
  TYT: {
    "tyt-tr": 3.3,
    "tyt-mat": 3.3,
    "tyt-sos": 3.4,
    "tyt-fen": 3.4,
  },
  SAY: {
    "tyt-tr": 1.32,
    "tyt-mat": 1.32,
    "tyt-sos": 1.36,
    "tyt-fen": 1.36,
    "ayt-mat": 3.0,
    "ayt-fiz": 2.85,
    "ayt-kim": 3.07,
    "ayt-bio": 3.07,
  },
  EA: {
    "tyt-tr": 1.32,
    "tyt-mat": 1.32,
    "tyt-sos": 1.36,
    "tyt-fen": 1.36,
    "ea-mat": 3.0,
    "ea-edb": 3.0,
    "ea-tar1": 2.8,
    "ea-cog1": 3.3,
  },
  SÖZ: {
    "tyt-tr": 1.32,
    "tyt-mat": 1.32,
    "tyt-sos": 1.36,
    "tyt-fen": 1.36,
    "soz-edb": 3.0,
    "soz-tar1": 2.8,
    "soz-cog1": 3.3,
    "soz-tar2": 2.9,
    "soz-cog2": 2.9,
    "soz-fel": 3.0,
    "soz-dkab": 3.3,
  },
  DİL: {
    "tyt-tr": 1.53,
    "tyt-mat": 1.77,
    "tyt-sos": 1.62,
    "tyt-fen": 1.37,
    "ydt-dil": 2.6,
  },
} as const;

/** Puan türü → en az bir satırda giriş olmalı (kart bazlı) */
export const CARD_ROW_IDS_BY_TUR: Record<YksPuanTuru, readonly string[]> = {
  TYT: ["tyt-tr", "tyt-mat", "tyt-sos", "tyt-fen"],
  SAY: ["tyt-tr", "tyt-mat", "tyt-sos", "tyt-fen", "ayt-mat", "ayt-fiz", "ayt-kim", "ayt-bio"],
  EA: ["tyt-tr", "tyt-mat", "tyt-sos", "tyt-fen", "ea-mat", "ea-edb", "ea-tar1", "ea-cog1"],
  SÖZ: [
    "tyt-tr",
    "tyt-mat",
    "tyt-sos",
    "tyt-fen",
    "soz-edb",
    "soz-tar1",
    "soz-cog1",
    "soz-tar2",
    "soz-cog2",
    "soz-fel",
    "soz-dkab",
  ],
  DİL: ["tyt-tr", "tyt-mat", "tyt-sos", "tyt-fen", "ydt-dil"],
};

export const ROW_ID_TO_ENGINE_FIELD = {
  "tyt-tr": { track: "tyt", field: "turkce" },
  "tyt-mat": { track: "tyt", field: "matematik" },
  "tyt-sos": { track: "tyt", field: "sosyal" },
  "tyt-fen": { track: "tyt", field: "fen" },
  "ayt-mat": { track: "say", field: "matematik" },
  "ayt-fiz": { track: "say", field: "fizik" },
  "ayt-kim": { track: "say", field: "kimya" },
  "ayt-bio": { track: "say", field: "biyoloji" },
  "ea-mat": { track: "ea", field: "matematik" },
  "ea-edb": { track: "ea", field: "edebiyat" },
  "ea-tar1": { track: "ea", field: "tarih1" },
  "ea-cog1": { track: "ea", field: "cografya1" },
  "soz-edb": { track: "soz", field: "edebiyat" },
  "soz-tar1": { track: "soz", field: "tarih1" },
  "soz-cog1": { track: "soz", field: "cografya1" },
  "soz-tar2": { track: "soz", field: "tarih2" },
  "soz-cog2": { track: "soz", field: "cografya2" },
  "soz-fel": { track: "soz", field: "felsefe" },
  "soz-dkab": { track: "soz", field: "din" },
  "ydt-dil": { track: "dil", field: "yabanciDil" },
} as const;

// ─── Types ───────────────────────────────────────────────────────────────────

export type YksPuanTuru = "TYT" | "SAY" | "EA" | "SÖZ" | "DİL";

export interface SubjectNetInput {
  correct: number;
  incorrect: number;
}

export interface TytScoreInputs {
  turkce: SubjectNetInput;
  matematik: SubjectNetInput;
  sosyal: SubjectNetInput;
  fen: SubjectNetInput;
}

export interface AytSayInputs {
  matematik: SubjectNetInput;
  fizik: SubjectNetInput;
  kimya: SubjectNetInput;
  biyoloji: SubjectNetInput;
}

export interface AytEaInputs {
  matematik: SubjectNetInput;
  edebiyat: SubjectNetInput;
  tarih1: SubjectNetInput;
  cografya1: SubjectNetInput;
}

export interface AytSozInputs {
  edebiyat: SubjectNetInput;
  tarih1: SubjectNetInput;
  cografya1: SubjectNetInput;
  tarih2: SubjectNetInput;
  cografya2: SubjectNetInput;
  felsefe: SubjectNetInput;
  din: SubjectNetInput;
}

export interface YdtInputs {
  yabanciDil: SubjectNetInput;
}

export interface ScoreInputs {
  tyt: TytScoreInputs;
  ayt?: {
    say?: Partial<AytSayInputs>;
    ea?: Partial<AytEaInputs>;
    soz?: Partial<AytSozInputs>;
  };
  ydt?: Partial<YdtInputs>;
  diplomaGrade: number;
  placedPreviously?: boolean;
}

export interface MatrixTermResult {
  rowId: string;
  net: number;
  coefficient: number;
  contribution: number;
  hasInput: boolean;
}

export interface PlacementScoreBreakdown {
  ham: number;
  weightedSum: number;
  terms: MatrixTermResult[];
  placement: number;
}

export interface TytScoreResult extends PlacementScoreBreakdown {
  subjects: Record<keyof TytScoreInputs, SubjectNetResult>;
}

export interface SubjectNetResult {
  correct: number;
  incorrect: number;
  net: number;
  weighted: number;
  coefficient: number;
  hasInput: boolean;
}

export interface AytTrackScoreResult extends PlacementScoreBreakdown {
  subjects: Record<string, SubjectNetResult>;
}

export interface YksScoreOutputs {
  version: typeof YKS_ENGINE_VERSION;
  obp: number;
  diplomaGradeClamped: number;
  tyt: TytScoreResult | null;
  say: AytTrackScoreResult | null;
  ea: AytTrackScoreResult | null;
  soz: AytTrackScoreResult | null;
  dil: AytTrackScoreResult | null;
  /** Ham (OBP öncesi) — rawTYT, rawSAY, … */
  hamByTur: Record<YksPuanTuru, number | null>;
  /** Yerleştirme — placedTYT, placedSAY, … */
  placementByTur: Record<YksPuanTuru, number | null>;
  /** @deprecated use hamByTur */
  rawByTur: Record<YksPuanTuru, number | null>;
  /** @deprecated use placementByTur */
  placedByTur: Record<YksPuanTuru, number | null>;
}

// ─── Primitives ──────────────────────────────────────────────────────────────

function toNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function roundScore(n: number, digits = 3): number {
  const pow = 10 ** digits;
  return Math.round((toNum(n) + Number.EPSILON) * pow) / pow;
}

export function calculateNet(correct: number, incorrect: number): number {
  return toNum(correct) - toNum(incorrect) / NET_WRONG_DIVISOR;
}

/** Diploma notu 50–100 aralığına sıkıştır */
export function clampDiplomaGrade(grade: number): number {
  const g = toNum(grade);
  if (g <= 0) return 0;
  return Math.min(DIPLOMA_MAX, Math.max(DIPLOMA_MIN, g));
}

/**
 * OBP = diploma × 5 × 0,12 (max 60 @ diploma 100)
 * Kırık OBP (önceki yıl yerleşti): çarpan 0,06
 */
export function calculateOBP(
  diplomaGrade: number,
  placedPreviously = false
): number {
  const clamped = clampDiplomaGrade(diplomaGrade);
  if (clamped <= 0) return 0;
  const rate = placedPreviously ? OBP_RATE_PLACED_PREVIOUSLY : OBP_RATE;
  return roundScore(clamped * 5 * rate);
}

export function applyOBP(hamScore: number, obp: number): number {
  return roundScore(toNum(hamScore) + toNum(obp));
}

// ─── Net map from UI-shaped inputs ───────────────────────────────────────────

export type RowNetMap = Record<string, number>;

const ROW_ID_FROM_TYT: Record<keyof TytScoreInputs, string> = {
  turkce: "tyt-tr",
  matematik: "tyt-mat",
  sosyal: "tyt-sos",
  fen: "tyt-fen",
};

function subjectNetFromInput(input: SubjectNetInput): SubjectNetResult {
  const correct = Math.max(0, toNum(input.correct));
  const incorrect = Math.max(0, toNum(input.incorrect));
  const hasInput = correct > 0 || incorrect > 0;
  const net = calculateNet(correct, incorrect);
  return {
    correct,
    incorrect,
    net,
    weighted: 0,
    coefficient: 0,
    hasInput,
  };
}

function pushNet(
  map: RowNetMap,
  rowId: string,
  input: SubjectNetInput | undefined
): void {
  if (!input) return;
  const correct = Math.max(0, toNum(input.correct));
  const incorrect = Math.max(0, toNum(input.incorrect));
  if (correct <= 0 && incorrect <= 0) return;
  map[rowId] = calculateNet(correct, incorrect);
}

export function buildRowNetMap(input: ScoreInputs): RowNetMap {
  const map: RowNetMap = {};

  const tytFields: (keyof TytScoreInputs)[] = ["turkce", "matematik", "sosyal", "fen"];
  for (const f of tytFields) {
    pushNet(map, ROW_ID_FROM_TYT[f], input.tyt[f]);
  }

  const sayFields: (keyof AytSayInputs)[] = ["matematik", "fizik", "kimya", "biyoloji"];
  const sayRowIds = ["ayt-mat", "ayt-fiz", "ayt-kim", "ayt-bio"];
  sayFields.forEach((f, i) => pushNet(map, sayRowIds[i]!, input.ayt?.say?.[f]));

  const eaFields: (keyof AytEaInputs)[] = ["matematik", "edebiyat", "tarih1", "cografya1"];
  const eaRowIds = ["ea-mat", "ea-edb", "ea-tar1", "ea-cog1"];
  eaFields.forEach((f, i) => pushNet(map, eaRowIds[i]!, input.ayt?.ea?.[f]));

  const sozFields: (keyof AytSozInputs)[] = [
    "edebiyat",
    "tarih1",
    "cografya1",
    "tarih2",
    "cografya2",
    "felsefe",
    "din",
  ];
  const sozRowIds = [
    "soz-edb",
    "soz-tar1",
    "soz-cog1",
    "soz-tar2",
    "soz-cog2",
    "soz-fel",
    "soz-dkab",
  ];
  sozFields.forEach((f, i) => pushNet(map, sozRowIds[i]!, input.ayt?.soz?.[f]));

  pushNet(map, "ydt-dil", input.ydt?.yabanciDil);

  return map;
}

function hasInputOnRows(rowIds: readonly string[], rowNets: RowNetMap): boolean {
  return rowIds.some((id) => id in rowNets);
}

/** Matristeki her test için net×katsayı; girilmeyen test net=0 */
export function calculateHamFromCoefficientMatrix(
  tur: YksPuanTuru,
  rowNets: RowNetMap
): PlacementScoreBreakdown {
  const matrix = PLACEMENT_COEFFICIENT_MATRIX[tur];
  const terms: MatrixTermResult[] = [];
  let weightedSum = 0;

  for (const [rowId, coefficient] of Object.entries(matrix)) {
    const net = rowNets[rowId] ?? 0;
    const contribution = net * coefficient;
    weightedSum += contribution;
    terms.push({
      rowId,
      net,
      coefficient,
      contribution: roundScore(contribution, 4),
      hasInput: rowId in rowNets && rowNets[rowId] !== 0,
    });
  }

  const ham = roundScore(SCORE_BASE + weightedSum);
  return {
    ham,
    weightedSum: roundScore(weightedSum),
    terms,
    placement: ham,
  };
}

export function calculateTYT(tyt: TytScoreInputs): TytScoreResult {
  const rowNets = buildRowNetMap({ tyt, diplomaGrade: 0 });
  const breakdown = calculateHamFromCoefficientMatrix("TYT", rowNets);

  const subjects = {} as Record<keyof TytScoreInputs, SubjectNetResult>;
  (Object.keys(TYT_SUBJECT_COEFFICIENTS) as (keyof TytScoreInputs)[]).forEach((field) => {
    const rowId = ROW_ID_FROM_TYT[field];
    const coeff = TYT_SUBJECT_COEFFICIENTS[field];
    const base = subjectNetFromInput(tyt[field]);
    subjects[field] = {
      ...base,
      coefficient: coeff,
      weighted: roundScore(base.net * coeff, 4),
    };
  });

  return { ...breakdown, subjects };
}

function trackResultFromMatrix(
  tur: Exclude<YksPuanTuru, "TYT">,
  rowNets: RowNetMap
): AytTrackScoreResult {
  const breakdown = calculateHamFromCoefficientMatrix(tur, rowNets);
  const matrix = PLACEMENT_COEFFICIENT_MATRIX[tur];
  const subjects: Record<string, SubjectNetResult> = {};

  for (const rowId of Object.keys(matrix)) {
    const net = rowNets[rowId] ?? 0;
    const coeff = matrix[rowId as keyof typeof matrix] as number;
    subjects[rowId] = {
      correct: 0,
      incorrect: 0,
      net,
      coefficient: coeff,
      weighted: roundScore(net * coeff, 4),
      hasInput: rowId in rowNets && rowNets[rowId] !== 0,
    };
  }

  return { ...breakdown, subjects };
}

export function computeYksScores(input: ScoreInputs): YksScoreOutputs {
  const diplomaGradeClamped = clampDiplomaGrade(input.diplomaGrade);
  const obp = calculateOBP(diplomaGradeClamped, input.placedPreviously ?? false);
  const rowNets = buildRowNetMap({ ...input, diplomaGrade: diplomaGradeClamped });

  const hamByTur: Record<YksPuanTuru, number | null> = {
    TYT: null,
    SAY: null,
    EA: null,
    SÖZ: null,
    DİL: null,
  };
  const placementByTur: Record<YksPuanTuru, number | null> = {
    TYT: null,
    SAY: null,
    EA: null,
    SÖZ: null,
    DİL: null,
  };

  let tyt: TytScoreResult | null = null;
  let say: AytTrackScoreResult | null = null;
  let ea: AytTrackScoreResult | null = null;
  let soz: AytTrackScoreResult | null = null;
  let dil: AytTrackScoreResult | null = null;

  if (hasInputOnRows(CARD_ROW_IDS_BY_TUR.TYT, rowNets)) {
    tyt = calculateTYT(input.tyt);
    tyt.placement = applyOBP(tyt.ham, obp);
    hamByTur.TYT = tyt.ham;
    placementByTur.TYT = tyt.placement;
  }

  const attachTrack = (
    tur: Exclude<YksPuanTuru, "TYT">,
    cardRowIds: readonly string[]
  ): AytTrackScoreResult | null => {
    if (!hasInputOnRows(cardRowIds, rowNets)) return null;
    const result = trackResultFromMatrix(tur, rowNets);
    result.placement = applyOBP(result.ham, obp);
    hamByTur[tur] = result.ham;
    placementByTur[tur] = result.placement;
    return result;
  };

  say = attachTrack("SAY", CARD_ROW_IDS_BY_TUR.SAY);
  ea = attachTrack("EA", CARD_ROW_IDS_BY_TUR.EA);
  soz = attachTrack("SÖZ", CARD_ROW_IDS_BY_TUR.SÖZ);
  dil = attachTrack("DİL", CARD_ROW_IDS_BY_TUR.DİL);

  return {
    version: YKS_ENGINE_VERSION,
    obp,
    diplomaGradeClamped,
    tyt,
    say,
    ea,
    soz,
    dil,
    hamByTur,
    placementByTur,
    rawByTur: hamByTur,
    placedByTur: placementByTur,
  };
}

// ─── Legacy UI adapter ───────────────────────────────────────────────────────

export type LegacyRowInput = { d: string; y: string };

const EMPTY_SUBJECT: SubjectNetInput = { correct: 0, incorrect: 0 };

function rowToSubject(rows: Record<string, LegacyRowInput>, rowId: string): SubjectNetInput {
  const r = rows[rowId];
  if (!r) return { ...EMPTY_SUBJECT };
  const d = String(r.d ?? "").trim();
  const y = String(r.y ?? "").trim();
  if (!d && !y) return { ...EMPTY_SUBJECT };
  return {
    correct: Math.max(0, parseInt(d, 10) || 0),
    incorrect: Math.max(0, parseInt(y, 10) || 0),
  };
}

export function mapLegacyRowsToScoreInputs(
  rows: Record<string, LegacyRowInput>,
  diploma: string,
  yerlesenHalf: boolean
): ScoreInputs {
  return {
    tyt: {
      turkce: rowToSubject(rows, "tyt-tr"),
      matematik: rowToSubject(rows, "tyt-mat"),
      sosyal: rowToSubject(rows, "tyt-sos"),
      fen: rowToSubject(rows, "tyt-fen"),
    },
    ayt: {
      say: {
        matematik: rowToSubject(rows, "ayt-mat"),
        fizik: rowToSubject(rows, "ayt-fiz"),
        kimya: rowToSubject(rows, "ayt-kim"),
        biyoloji: rowToSubject(rows, "ayt-bio"),
      },
      ea: {
        matematik: rowToSubject(rows, "ea-mat"),
        edebiyat: rowToSubject(rows, "ea-edb"),
        tarih1: rowToSubject(rows, "ea-tar1"),
        cografya1: rowToSubject(rows, "ea-cog1"),
      },
      soz: {
        edebiyat: rowToSubject(rows, "soz-edb"),
        tarih1: rowToSubject(rows, "soz-tar1"),
        cografya1: rowToSubject(rows, "soz-cog1"),
        tarih2: rowToSubject(rows, "soz-tar2"),
        cografya2: rowToSubject(rows, "soz-cog2"),
        felsefe: rowToSubject(rows, "soz-fel"),
        din: rowToSubject(rows, "soz-dkab"),
      },
    },
    ydt: {
      yabanciDil: rowToSubject(rows, "ydt-dil"),
    },
    diplomaGrade: Number(String(diploma).replace(",", ".")) || 0,
    placedPreviously: yerlesenHalf,
  };
}

/** @deprecated v1 — soru bazlı matriste kullanılmaz */
export function calculatePlacementHam(_tytHam: number, _aytBlockHam: number): number {
  throw new Error(
    "calculatePlacementHam (0.4/0.6) kaldırıldı; computeYksScores / calculateHamFromCoefficientMatrix kullanın"
  );
}
