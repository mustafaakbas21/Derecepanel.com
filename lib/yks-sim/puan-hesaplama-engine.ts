import {
  AYT_CARD_BY_TUR,
  PH_CARDS,
  PUAN_HESAPLAMA_MODEL_LABEL,
  type PhCardId,
  type PhRow,
  type YksPuanTuru,
} from "@/lib/yks-sim/puan-hesaplama-config";
import {
  fmtFixed,
  netFromCorrectWrong,
  roundTo,
} from "@/lib/scoring/score-calculator";
import { estimateRankFromCurve } from "@/lib/scoring/rank-curves";
import {
  computeYksScores,
  mapLegacyRowsToScoreInputs,
  type YksPuanTuru as EnginePuanTuru,
} from "@/lib/yksEngine";

export type { YksPuanTuru } from "@/lib/yks-sim/puan-hesaplama-config";
export { PUAN_HESAPLAMA_MODEL_LABEL };

export type RowInput = { d: string; y: string };

export type RowNetResult = {
  has: boolean;
  net: number;
  invalid: boolean;
  d: number;
  y: number;
};

export type OutputLine = {
  value: number | null;
  ham: number | null;
  sub: string;
  rank: number | null;
  rankLabel: string;
};

export type ScoreOutputs = {
  obp: number;
  yer: Record<YksPuanTuru, number | null>;
  ham: Record<YksPuanTuru, number | null>;
  used: Record<YksPuanTuru, boolean>;
  lines: Record<YksPuanTuru, OutputLine>;
  rowNets: Record<string, RowNetResult>;
  hasInvalidRows: boolean;
};

export type PuanHesaplamaInput = {
  rows: Record<string, RowInput>;
  diploma: string;
  yerlesenHalf: boolean;
};

const PUAN_TURLERI: YksPuanTuru[] = ["TYT", "SAY", "EA", "SÖZ", "DİL"];

export function parseRowInput(input: RowInput, maxQ: number): RowNetResult {
  const dRaw = String(input.d ?? "").trim();
  const yRaw = String(input.y ?? "").trim();
  const has = dRaw !== "" || yRaw !== "";
  if (!has) {
    return { has: false, net: 0, invalid: false, d: 0, y: 0 };
  }

  const dParsed = Math.max(0, parseInt(dRaw, 10) || 0);
  const yParsed = Math.max(0, parseInt(yRaw, 10) || 0);
  const invalid = maxQ > 0 && (dParsed > maxQ || yParsed > maxQ || dParsed + yParsed > maxQ);

  const d = maxQ > 0 ? Math.min(dParsed, maxQ) : dParsed;
  const y = maxQ > 0 ? Math.min(yParsed, Math.max(0, maxQ - d)) : yParsed;
  const net = netFromCorrectWrong(d, y);

  return { has, net, invalid, d, y };
}

export function clampRowInput(input: RowInput, maxQ: number): RowInput {
  const dRaw = String(input.d ?? "").trim();
  const yRaw = String(input.y ?? "").trim();
  if (dRaw === "" && yRaw === "") return { d: "", y: "" };

  const parsed = parseRowInput(input, maxQ);
  return {
    d: dRaw === "" ? "" : String(parsed.d),
    y: yRaw === "" ? "" : String(parsed.y),
  };
}

export function fmtNet(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtRank(r: number | null): string {
  if (r == null || !Number.isFinite(r) || r < 1) return "—";
  return Math.round(r).toLocaleString("tr-TR");
}

function weightedBlockFromCard(
  cardId: PhCardId,
  rowNets: Record<string, RowNetResult>
): { sum: number; has: boolean } {
  const card = PH_CARDS[cardId];
  let sum = 0;
  let has = false;
  for (const row of card.rows) {
    const r = rowNets[row.id];
    if (r?.has) has = true;
    sum += (r?.has ? r.net : 0) * row.weight;
  }
  return { sum, has };
}

function lineForTur(
  tur: YksPuanTuru,
  used: boolean,
  ham: number | null,
  placement: number | null,
  obp: number,
  sub: string
): OutputLine {
  if (!used || ham == null || placement == null) {
    const emptyMsg =
      tur === "TYT"
        ? "TYT netlerini girin"
        : "Bu puan türü için ilgili test netlerini girin";
    return {
      value: null,
      ham: null,
      sub: emptyMsg,
      rank: null,
      rankLabel: "",
    };
  }
  const rank = estimateRankFromCurve(tur, placement);
  return {
    value: placement,
    ham,
    sub,
    rank,
    rankLabel: rank != null ? `Tahmini sıra: ${fmtRank(rank)}` : "",
  };
}

function sublineForTur(tur: YksPuanTuru, obp: number, ham: number, tytBlockSum: number): string {
  if (tur === "TYT") {
    return `Ham: 100 + ${fmtFixed(tytBlockSum)} · OBP: +${fmtFixed(obp)}`;
  }
  const labelShort =
    tur === "SAY" ? "AYT-SAY" : tur === "EA" ? "AYT-EA" : tur === "SÖZ" ? "AYT-SÖZ" : "YDT";
  return `Soru bazlı matris (TYT+${labelShort}) · Ham: ${fmtFixed(ham)} · OBP: +${fmtFixed(obp)}`;
}

export function computePuanHesaplama(input: PuanHesaplamaInput): ScoreOutputs {
  const { rows, diploma, yerlesenHalf } = input;
  const maxQMap: Record<string, number> = {};
  for (const card of Object.values(PH_CARDS)) {
    for (const row of card.rows) {
      maxQMap[row.id] = row.maxQ;
    }
  }

  const rowNets: Record<string, RowNetResult> = {};
  let hasInvalidRows = false;

  for (const [rowId, maxQ] of Object.entries(maxQMap)) {
    const r = parseRowInput(rows[rowId] ?? { d: "", y: "" }, maxQ);
    rowNets[rowId] = r;
    if (r.invalid) hasInvalidRows = true;
  }

  const yks = computeYksScores(
    mapLegacyRowsToScoreInputs(rows, diploma, yerlesenHalf)
  );
  const obp = yks.obp;
  const tytBlock = weightedBlockFromCard("tyt", rowNets);

  const used = {} as Record<YksPuanTuru, boolean>;
  const ham = {} as Record<YksPuanTuru, number | null>;
  const yer = {} as Record<YksPuanTuru, number | null>;
  const lines = {} as Record<YksPuanTuru, OutputLine>;

  for (const tur of PUAN_TURLERI) {
    const engineTur = tur as EnginePuanTuru;
    const placement = yks.placementByTur[engineTur];
    const hamVal = yks.hamByTur[engineTur];
    const isUsed = placement != null && hamVal != null;

    used[tur] = isUsed;
    ham[tur] = hamVal;
    yer[tur] = placement;
    // placementHam legacy alan adı — ham ile aynı (matris birleşik ham)

    if (!isUsed) {
      lines[tur] = lineForTur(tur, false, null, null, obp, "");
      continue;
    }

    lines[tur] = lineForTur(
      tur,
      true,
      hamVal,
      placement,
      obp,
      sublineForTur(tur, obp, hamVal, tytBlock.sum)
    );
  }

  return {
    obp,
    yer,
    ham,
    used,
    lines,
    rowNets,
    hasInvalidRows,
  };
}

export function pickPrimaryTipi(yer: ScoreOutputs["yer"]): string {
  const order: YksPuanTuru[] = ["SAY", "EA", "SÖZ", "DİL", "TYT"];
  let best: YksPuanTuru = "TYT";
  let bestVal = -Infinity;
  for (const k of order) {
    const x = yer[k];
    if (x != null && Number.isFinite(x) && x > bestVal) {
      bestVal = x;
      best = k;
    }
  }
  return best;
}

/** Tercih köprüsü — ağırlıklı net blok toplamları (100 hariç) */
export function hamPayloadFromOutputs(o: ScoreOutputs): Record<string, number | null> {
  const block = (cardId: PhCardId) => {
    const b = weightedBlockFromCard(cardId, o.rowNets);
    return b.has ? roundTo(b.sum, 3) : null;
  };
  return {
    tyt: block("tyt"),
    say: block("say"),
    ea: block("ea"),
    soz: block("soz"),
    ydt: block("ydt"),
  };
}

export function tytScoreFromRows(rows: Record<string, RowInput>) {
  const yks = computeYksScores(mapLegacyRowsToScoreInputs(rows, "", false));
  const has = yks.tyt != null;
  const score = yks.tyt?.ham ?? 0;
  const nets = {
    turkce: yks.tyt?.subjects.turkce.net ?? 0,
    matematik: yks.tyt?.subjects.matematik.net ?? 0,
    sosyal: yks.tyt?.subjects.sosyal.net ?? 0,
    fen: yks.tyt?.subjects.fen.net ?? 0,
  };
  return { has, score, nets };
}

export function allRowDefs(): PhRow[] {
  const out: PhRow[] = [];
  for (const card of Object.values(PH_CARDS)) {
    for (const row of card.rows) out.push(row);
  }
  return out;
}

export function rowIdsForTur(tur: YksPuanTuru): string[] {
  if (tur === "TYT") return PH_CARDS.tyt.rows.map((r) => r.id);
  const cardId = AYT_CARD_BY_TUR[tur];
  return [...PH_CARDS.tyt.rows.map((r) => r.id), ...PH_CARDS[cardId].rows.map((r) => r.id)];
}
