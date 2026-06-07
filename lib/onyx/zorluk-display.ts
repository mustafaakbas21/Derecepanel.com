/** Onyx soru zorluğu — 1–5 ölçek, UI etiketleri */

export const ONYX_ZORLUK_LABELS: Record<number, string> = {
  1: "Kolay",
  2: "Orta-kolay",
  3: "Orta",
  4: "Zor",
  5: "Çok zor",
};

export function clampOnyxZorluk(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return 3;
  return Math.min(5, Math.max(1, Math.round(v)));
}

export function onyxZorlukLabel(level: number): string {
  return ONYX_ZORLUK_LABELS[clampOnyxZorluk(level)] ?? "Orta";
}

export function onyxZorlukStars(level: number): string {
  const n = clampOnyxZorluk(level);
  return "★".repeat(n) + "☆".repeat(5 - n);
}
