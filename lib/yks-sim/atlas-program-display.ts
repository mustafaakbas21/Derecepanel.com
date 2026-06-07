import { trUpper } from "@/lib/yks-sim/atlas-enrich";
import type { YokAtlasProgram } from "@/lib/universities/types";

/** ÖSYM özel koşul — 6 Şubat deprem bölgesi adayları kontenjanı */
export const DEPREM_KONTENJAN_KODU = "144";

const SKIP_UNI_SUFFIX =
  /\b(VAKIF|VAKFI|MYO|YÜKSEKOKUL|YUKSEKOKUL|ENSTİTÜ|ENSTITU|KOLEJ|FAKÜLTESİ|FAKULTESI)\b/;

function hasUniversiteWord(upper: string): boolean {
  const folded = upper
    .replace(/İ/g, "I")
    .replace(/İ/g, "I")
    .replace(/Ü/g, "U")
    .replace(/Ö/g, "O")
    .replace(/Ş/g, "S")
    .replace(/Ğ/g, "G")
    .replace(/Ç/g, "C");
  return folded.includes("UNIVERSITE");
}

const BURS_EK1 = new Set([
  "BURSLU",
  "UCRETLI",
  "ÜCRETLİ",
  "%50 İNDİRİMLİ",
  "%50 INDIRIMLI",
  "%25 İNDİRİMLİ",
  "%25 INDIRIMLI",
  "M.T.O.K.",
  "AÇIKÖĞRETİM",
  "ACIKOGRETIM",
  "UZAKTAN ÖĞRETİM",
  "UZAKTAN OGRETIM",
]);

const YABANCI_DILLER = ["ALMANCA", "ARAPÇA", "FRANSIZCA", "RUSÇA", "İSPANYOLCA", "ISPANYOLCA"];

export type BolumDili = "turkce" | "ingilizce" | "yabanci";

export function formatUniversiteDisplayName(raw: string): string {
  const name = String(raw ?? "").trim();
  if (!name) return "";

  const upper = trUpper(name);
  if (hasUniversiteWord(upper)) return name;
  if (SKIP_UNI_SUFFIX.test(upper)) return name;

  return `${name} Üniversitesi`;
}

function rowBlob(row: YokAtlasProgram): string {
  return trUpper(
    [row.Bolum, row.Fakulte_YO, row.Ek_Bilgi_1, row.Ek_Bilgi_2, row.Universite].join(" ")
  );
}

function ekAlanDil(ek: string): BolumDili | null {
  const u = trUpper(ek);
  if (!u) return null;
  if (u === "İNGİLİZCE" || u === "INGILIZCE") return "ingilizce";
  if (u === "TÜRKÇE" || u === "TURKCE") return "turkce";
  if (YABANCI_DILLER.some((d) => u === d || u.startsWith(d))) return "yabanci";
  if (BURS_EK1.has(u)) return null;
  return null;
}

/** Bölüm öğretim dili — Ek_Bilgi + bölüm adı metni */
export function deriveBolumDili(row: YokAtlasProgram): BolumDili {
  const fromEk1 = ekAlanDil(String(row.Ek_Bilgi_1 ?? "").trim());
  if (fromEk1) return fromEk1;
  const fromEk2 = ekAlanDil(String(row.Ek_Bilgi_2 ?? "").trim());
  if (fromEk2) return fromEk2;

  const blob = rowBlob(row);
  if (
    blob.includes("INGILIZCE") ||
    blob.includes("%30 INGILIZCE") ||
    blob.includes("%100 INGILIZCE") ||
    blob.includes("INGILIZCE)")
  ) {
    return "ingilizce";
  }
  if (YABANCI_DILLER.some((d) => blob.includes(d))) return "yabanci";

  return "turkce";
}

export function bolumDiliLabel(dil: BolumDili): string {
  if (dil === "ingilizce") return "İngilizce";
  if (dil === "yabanci") return "Yabancı dil";
  return "Türkçe";
}

/** ÖSYM Ek_Bilgi alanındaki burs etiketini doğrudan okur (en güvenilir kaynak). */
export function bursLabelFromEkBilgi(row: YokAtlasProgram): string | null {
  for (const ek of [row.Ek_Bilgi_1, row.Ek_Bilgi_2]) {
    const v = String(ek ?? "").trim();
    if (!v) continue;
    if (v === "Burslu") return "Burslu (Tam)";
    if (v === "Ücretli") return "Ücretli";
    if (v === "%25 İndirimli" || v === "%50 İndirimli") return v;
    const u = trUpper(v);
    if (u === "BURSLU") return "Burslu (Tam)";
    if (u === "ÜCRETLİ") return "Ücretli";
    if (u === "%25 İNDİRİMLİ") return "%25 İndirimli";
    if (u === "%50 İNDİRİMLİ") return "%50 İndirimli";
  }
  return null;
}

export function hasDepremKontenjan(row: YokAtlasProgram): boolean {
  const raw = String(row.Ozel_Kosul_Kodlari ?? "");
  if (!raw.trim()) return false;
  return raw
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .includes(DEPREM_KONTENJAN_KODU);
}

export function depremKontenjanLabel(row: YokAtlasProgram): string {
  return hasDepremKontenjan(row) ? "Var" : "—";
}

export function buildAtlasSearchText(row: YokAtlasProgram, universiteDisplay?: string): string {
  return [
    row.Universite,
    universiteDisplay,
    row.Bolum,
    row.Fakulte_YO,
    row.Sehir,
    row.Puan_Tipi,
    row.Program_Kodu,
    row.Ek_Bilgi_1,
    row.Ek_Bilgi_2,
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("tr-TR");
}
