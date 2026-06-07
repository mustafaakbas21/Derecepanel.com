/** Analiz Merkezi V2 — grafik renk paleti ve yardımcılar */

export const AM_CHART = {
  indigo: "#4f46e5",
  violet: "#7c3aed",
  emerald: "#10b981",
  sky: "#0ea5e9",
  amber: "#f59e0b",
  rose: "#f43f5e",
  slate: "#64748b",
  grid: "#e2e8f0",
  gridLight: "#f1f5f9",
  correct: "#10b981",
  wrong: "#f43f5e",
  empty: "#94a3b8",
  student: "#6366f1",
  class: "#14b8a6",
  top: "#f59e0b",
  forecast: "#a78bfa",
} as const;

export const AM_GRADIENT_IDS = {
  barPrimary: "amGradBarPrimary",
  barEmerald: "amGradBarEmerald",
  barRose: "amGradBarRose",
  areaTrend: "amGradAreaTrend",
  donut: "amGradDonut",
} as const;

/** Başarı oranına göre bar rengi */
export function rateToHex(rate: number): string {
  if (rate >= 70) return AM_CHART.emerald;
  if (rate >= 50) return AM_CHART.sky;
  if (rate >= 35) return AM_CHART.amber;
  return AM_CHART.rose;
}

export function rateToBgClass(rate: number): string {
  if (rate >= 70) return "bg-emerald-500";
  if (rate >= 50) return "bg-sky-500";
  if (rate >= 35) return "bg-amber-500";
  return "bg-rose-500";
}

export function rateToTextClass(rate: number): string {
  if (rate >= 70) return "text-emerald-700";
  if (rate >= 50) return "text-sky-700";
  if (rate >= 35) return "text-amber-700";
  return "text-rose-700";
}

export function rateToLightBg(rate: number): string {
  if (rate >= 70) return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (rate >= 50) return "bg-sky-50 text-sky-800 border-sky-200";
  if (rate >= 35) return "bg-amber-50 text-amber-800 border-amber-200";
  return "bg-rose-50 text-rose-800 border-rose-200";
}

/** Net dağılımı için bucket */
export function bucketNetDistribution(
  nets: number[],
  maxNet = 120
): { range: string; count: number; fill: string }[] {
  const step = 20;
  const buckets: { range: string; count: number; fill: string }[] = [];
  for (let lo = 0; lo < maxNet; lo += step) {
    const hi = lo + step;
    const count = nets.filter((n) => n >= lo && (hi >= maxNet ? n <= hi : n < hi)).length;
    const mid = (lo + hi) / 2;
    buckets.push({
      range: `${lo}–${hi}`,
      count,
      fill: rateToHex((mid / maxNet) * 100),
    });
  }
  return buckets;
}
