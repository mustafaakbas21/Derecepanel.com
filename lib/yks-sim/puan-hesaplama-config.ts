export type PhRow = { id: string; label: string; maxQ: number; weight: number };

export type PhCard = { id: string; title: string; badge: string; rows: PhRow[] };

export type YksPuanTuru = "TYT" | "SAY" | "EA" | "SÖZ" | "DİL";

/**
 * MEB / OGM Materyal ve eski DerecePanel ile uyumlu satır ağırlıkları.
 * Yerleştirme: 100 + Σ(net×katsayı) (puan türü matrisi) + OBP
 * @see https://ogmmateryal.eba.gov.tr/yks-puan-hesaplama
 */
export const PUAN_HESAPLAMA_MODEL_LABEL = "ÖSYM soru bazlı matris";

export const PH_CARDS = {
  tyt: {
    id: "tyt",
    title: "TYT",
    badge: "Temel Yeterlilik",
    rows: [
      { id: "tyt-tr", label: "Türkçe", maxQ: 40, weight: 3.3 },
      { id: "tyt-mat", label: "Temel Matematik", maxQ: 40, weight: 3.3 },
      { id: "tyt-sos", label: "Sosyal Bilimler", maxQ: 20, weight: 3.4 },
      { id: "tyt-fen", label: "Fen Bilimleri", maxQ: 20, weight: 3.4 },
    ],
  },
  say: {
    id: "say",
    title: "AYT Sayısal",
    badge: "SAY",
    rows: [
      { id: "ayt-mat", label: "Matematik (AYT)", maxQ: 40, weight: 3 },
      { id: "ayt-fiz", label: "Fizik", maxQ: 14, weight: 2.8 },
      { id: "ayt-kim", label: "Kimya", maxQ: 13, weight: 3 },
      { id: "ayt-bio", label: "Biyoloji", maxQ: 13, weight: 3 },
    ],
  },
  ea: {
    id: "ea",
    title: "Eşit ağırlık",
    badge: "EA",
    rows: [
      { id: "ea-mat", label: "Matematik (AYT)", maxQ: 40, weight: 3 },
      { id: "ea-edb", label: "Türk Dili ve Edebiyatı", maxQ: 24, weight: 3 },
      { id: "ea-tar1", label: "Tarih-1", maxQ: 10, weight: 2.8 },
      { id: "ea-cog1", label: "Coğrafya-1", maxQ: 6, weight: 3.3 },
    ],
  },
  soz: {
    id: "soz",
    title: "Sözel",
    badge: "SÖZ",
    rows: [
      { id: "soz-edb", label: "Edebiyat", maxQ: 24, weight: 3 },
      { id: "soz-tar1", label: "Tarih-1", maxQ: 10, weight: 2.8 },
      { id: "soz-cog1", label: "Coğrafya-1", maxQ: 6, weight: 3.3 },
      { id: "soz-tar2", label: "Tarih-2", maxQ: 11, weight: 2.8 },
      { id: "soz-cog2", label: "Coğrafya-2", maxQ: 11, weight: 2.8 },
      { id: "soz-fel", label: "Felsefe Grubu", maxQ: 12, weight: 3 },
      { id: "soz-dkab", label: "DKAB / İlave Felsefe", maxQ: 6, weight: 2.8 },
    ],
  },
  ydt: {
    id: "ydt",
    title: "YDT",
    badge: "Dil",
    rows: [{ id: "ydt-dil", label: "Yabancı dil", maxQ: 80, weight: 3.3 }],
  },
} as const satisfies Record<string, PhCard>;

export type PhCardId = keyof typeof PH_CARDS;

export const PH_CARD_IDS: PhCardId[] = ["tyt", "say", "ea", "soz", "ydt"];

/** Puan türü → AYT/YDT kartı */
export const AYT_CARD_BY_TUR: Record<Exclude<YksPuanTuru, "TYT">, PhCardId> = {
  SAY: "say",
  EA: "ea",
  SÖZ: "soz",
  DİL: "ydt",
};

export function createEmptyRowInputs(): Record<string, { d: string; y: string }> {
  const rows: Record<string, { d: string; y: string }> = {};
  for (const card of Object.values(PH_CARDS)) {
    for (const row of card.rows) {
      rows[row.id] = { d: "", y: "" };
    }
  }
  return rows;
}

export function findPhRowById(id: string): PhRow | undefined {
  for (const card of Object.values(PH_CARDS)) {
    for (const row of card.rows) {
      if (row.id === id) return row;
    }
  }
  return undefined;
}

export function phMaxQuestionsByRowId(): Record<string, number> {
  const map: Record<string, number> = {};
  for (const card of Object.values(PH_CARDS)) {
    for (const row of card.rows) {
      map[row.id] = row.maxQ;
    }
  }
  return map;
}

export function phWeightByRowId(): Record<string, number> {
  const map: Record<string, number> = {};
  for (const card of Object.values(PH_CARDS)) {
    for (const row of card.rows) {
      map[row.id] = row.weight;
    }
  }
  return map;
}
