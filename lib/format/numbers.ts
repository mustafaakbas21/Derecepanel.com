/** Binlik ayraç nokta (tr-TR görünüm) */
export function formatTrNumber(n: number, fractionDigits = 0): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("tr-TR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

/** YÖK atlas taban puanı — kaynakta nokta ondalık (örn. 551.132) */
export function formatAtlasTaban(raw: unknown): string {
  const s = String(raw ?? "").trim();
  if (!s) return "—";
  return s;
}

/** YÖK atlas başarı sırası — büyük sayılarda binlik ayraç (örn. 10.008) */
export function formatAtlasSira(raw: unknown): string {
  const s = String(raw ?? "").trim();
  if (!s) return "—";
  const digits = s.replace(/\./g, "").replace(/\D/g, "");
  if (!digits) return "—";
  const n = Number.parseInt(digits, 10);
  if (!Number.isFinite(n) || n < 1) return "—";
  return n.toLocaleString("tr-TR");
}
