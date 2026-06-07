import { basariKey, tabanKey } from "@/lib/yks-sim/atlas-filter";
import type { YokAtlasProgramEnriched } from "@/lib/yks-sim/atlas-enrich";
import type { YokAtlasProgram } from "@/lib/universities/types";

export type HedefSortKey =
  | "taban_desc"
  | "taban_asc"
  | "sira_asc"
  | "sira_desc"
  | "uni_asc"
  | "bolum_asc";

export const HEDEF_SORT_OPTIONS: { value: HedefSortKey; label: string }[] = [
  { value: "taban_desc", label: "Taban puanı (yüksek → düşük)" },
  { value: "taban_asc", label: "Taban puanı (düşük → yüksek)" },
  { value: "sira_asc", label: "Başarı sırası (en iyi önce)" },
  { value: "sira_desc", label: "Başarı sırası (en zor önce)" },
  { value: "uni_asc", label: "Üniversite (A → Z)" },
  { value: "bolum_asc", label: "Bölüm (A → Z)" },
];

function parseTabanNum(raw: unknown): number {
  const s = String(raw ?? "").trim().replace(",", ".");
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : -Infinity;
}

function parseSiraNum(raw: unknown): number {
  const digits = String(raw ?? "")
    .trim()
    .replace(/\./g, "")
    .replace(/\D/g, "");
  const n = Number.parseInt(digits, 10);
  return Number.isFinite(n) && n > 0 ? n : Infinity;
}

export function sortAtlasProgramsForHedef(
  rows: YokAtlasProgramEnriched[],
  year: string,
  sortKey: HedefSortKey
): YokAtlasProgramEnriched[] {
  const list = [...rows];
  const tk = tabanKey(year);
  const bk = basariKey(year);

  list.sort((a, b) => {
    switch (sortKey) {
      case "taban_desc":
        return parseTabanNum(b[tk] ?? b.Taban_Puani_Guncel) - parseTabanNum(a[tk] ?? a.Taban_Puani_Guncel);
      case "taban_asc":
        return parseTabanNum(a[tk] ?? a.Taban_Puani_Guncel) - parseTabanNum(b[tk] ?? b.Taban_Puani_Guncel);
      case "sira_asc":
        return parseSiraNum(a[bk] ?? a.Basari_Sirasi_Guncel) - parseSiraNum(b[bk] ?? b.Basari_Sirasi_Guncel);
      case "sira_desc":
        return parseSiraNum(b[bk] ?? b.Basari_Sirasi_Guncel) - parseSiraNum(a[bk] ?? a.Basari_Sirasi_Guncel);
      case "uni_asc":
        return String(a.Universite ?? "").localeCompare(String(b.Universite ?? ""), "tr-TR");
      case "bolum_asc":
        return String(a.Bolum ?? "").localeCompare(String(b.Bolum ?? ""), "tr-TR");
      default:
        return 0;
    }
  });

  return list;
}

export function programRowToTargetPayload(
  p: YokAtlasProgram,
  year: string,
  enriched?: YokAtlasProgramEnriched
) {
  return {
    universite: String(p.Universite ?? ""),
    bolum: String(p.Bolum ?? ""),
    fakulteYO: p.Fakulte_YO,
    sehir: p.Sehir,
    puanTipi: p.Puan_Tipi,
    programKodu: String(p.Program_Kodu ?? ""),
    taban: String(p[tabanKey(year)] ?? p.Taban_Puani_Guncel ?? ""),
    basari: String(p[basariKey(year)] ?? p.Basari_Sirasi_Guncel ?? ""),
    year,
  };
}
