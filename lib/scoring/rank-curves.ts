/** Eğitim amaçlı tahmini sıra eğrileri — resmi ÖSYM değildir */

export type PuanTipiKey = "TYT" | "SAY" | "EA" | "SÖZ" | "DİL";

export const RANK_CURVES: Record<PuanTipiKey, [number, number][]> = {
  TYT: [
    [120, 5_500_000],
    [180, 3_500_000],
    [250, 1_800_000],
    [300, 950_000],
    [350, 320_000],
    [400, 65_000],
    [440, 8_000],
  ],
  SAY: [
    [160, 3_200_000],
    [220, 1_200_000],
    [280, 350_000],
    [320, 95_000],
    [360, 22_000],
    [400, 5_500],
    [440, 650],
    [480, 85],
  ],
  EA: [
    [160, 3_000_000],
    [220, 1_100_000],
    [280, 380_000],
    [320, 150_000],
    [350, 120_000],
    [380, 52_000],
    [400, 45_000],
    [430, 12_000],
    [470, 900],
    [500, 120],
  ],
  SÖZ: [
    [150, 4_200_000],
    [200, 1_800_000],
    [260, 520_000],
    [300, 140_000],
    [340, 48_000],
    [380, 12_000],
    [420, 2_200],
    [455, 280],
  ],
  DİL: [
    [140, 2_200_000],
    [180, 620_000],
    [220, 150_000],
    [260, 42_000],
    [300, 11_000],
    [340, 2_800],
    [380, 520],
    [430, 45],
  ],
};

export function estimateRankFromCurve(
  puanTipi: string,
  score: number | null
): number | null {
  if (score == null || !Number.isFinite(score)) return null;
  const key = normalizePuanTipi(puanTipi);
  const curve = RANK_CURVES[key];
  if (!curve?.length) return null;
  if (score <= curve[0]![0]) return curve[0]![1];
  const last = curve[curve.length - 1]!;
  if (score >= last[0]) return last[1];
  for (let i = 0; i < curve.length - 1; i++) {
    const a = curve[i]!;
    const b = curve[i + 1]!;
    if (score >= a[0] && score <= b[0]) {
      const t = (score - a[0]) / (b[0] - a[0]);
      return Math.round(a[1] + t * (b[1] - a[1]));
    }
  }
  return null;
}

export function normalizePuanTipi(raw: string): PuanTipiKey {
  const s = String(raw || "")
    .toUpperCase()
    .replace(/İ/g, "I")
    .replace(/Ö/g, "O")
    .replace(/Ü/g, "U")
    .replace(/Ş/g, "S")
    .replace(/Ç/g, "C")
    .replace(/Ğ/g, "G")
    .trim();
  if (s.includes("SAY")) return "SAY";
  if (s.includes("EA") || s.includes("ESIT")) return "EA";
  if (s.includes("SOZ") || s.includes("SÖZ")) return "SÖZ";
  if (s.includes("DIL") || s.includes("DİL") || s.includes("YDT")) return "DİL";
  if (s.includes("TYT")) return "TYT";
  return "TYT";
}
