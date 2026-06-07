import type { OnyxDeepErrorDiagnosis } from "@/lib/onyx/deep-error-diagnosis";

/** Vision / metin soru çözümü yapısal çıktı */
export type OnyxSolveStructured = {
  cozum: string;
  konu_basligi: string;
  zorluk_seviyesi: number;
  hata_kodu: string;
  coach_insight?: string;
  deepDiagnosis?: OnyxDeepErrorDiagnosis;
};

export function clampZorluk(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return 3;
  return Math.min(5, Math.max(1, Math.round(v)));
}
