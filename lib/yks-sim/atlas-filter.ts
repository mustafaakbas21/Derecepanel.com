import {
  formatUniversiteDisplayName,
  type BolumDili,
} from "@/lib/yks-sim/atlas-program-display";
import {
  matchesBursFilter,
  matchesKurum,
  matchesOgrenim,
  normPuanTip,
  type YokAtlasProgramEnriched,
} from "@/lib/yks-sim/atlas-enrich";
import type { YokAtlasProgram } from "@/lib/universities/types";

export type AtlasFilterParams = {
  search?: string;
  puanTipi?: string;
  sehir?: string;
  universite?: string;
  limit?: number;
};

export type AtlasFilterParamsExtended = {
  year?: string;
  puanTipleri?: string[];
  sehirler?: string[];
  universiteler?: string[];
  bolumler?: string[];
  bsMin?: number | null;
  bsMax?: number | null;
  kurum?: string;
  ogrenim?: string;
  burs?: string[];
  bolumDili?: BolumDili[];
  depremKontenjan?: "" | "var" | "yok";
  search?: string;
  page?: number;
  pageSize?: number;
};

export function enrichAtlasSearchRow(
  p: YokAtlasProgram | YokAtlasProgramEnriched
): YokAtlasProgramEnriched {
  const enriched = p as YokAtlasProgramEnriched;
  if (enriched._search) return enriched;
  const universiteDisplay =
    enriched.universiteDisplay ?? formatUniversiteDisplayName(p.Universite);
  const _search = [
    p.Universite,
    universiteDisplay,
    p.Bolum,
    p.Fakulte_YO,
    p.Sehir,
    p.Puan_Tipi,
    p.Program_Kodu,
  ]
    .join(" ")
    .toLocaleLowerCase("tr-TR");
  return { ...p, universiteDisplay, _search };
}

export function basariKey(year: string): keyof YokAtlasProgram {
  return `Basari_${year}` as keyof YokAtlasProgram;
}

export function tabanKey(year: string): keyof YokAtlasProgram {
  return `Taban_${year}` as keyof YokAtlasProgram;
}

export function kontenjanKey(year: string): keyof YokAtlasProgram {
  return `Kontenjan_${year}_Genel` as keyof YokAtlasProgram;
}

export function rowHasYearData(row: YokAtlasProgram, year: string): boolean {
  const b = row[basariKey(year)];
  const t = row[tabanKey(year)];
  const hasB = b != null && String(b).trim() !== "";
  const hasT = t != null && String(t).trim() !== "";
  return hasB || hasT;
}

export function parseRank(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = parseInt(String(v).replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

export function kontenjanOf(row: YokAtlasProgram, year: string): string {
  const k = row[kontenjanKey(year)];
  if (k != null && String(k).trim() !== "") return String(k).trim();
  if (row.Kontenjan_Diger != null && String(row.Kontenjan_Diger).trim() !== "")
    return String(row.Kontenjan_Diger).trim();
  return "—";
}

function parsePuanSet(list: string[]): Record<string, boolean> | null {
  if (!list.length) return null;
  const set: Record<string, boolean> = {};
  for (const p of list) {
    const n = normPuanTip(p);
    if (n) set[n] = true;
  }
  return Object.keys(set).length ? set : null;
}

function collectFiltered(
  rows: YokAtlasProgramEnriched[],
  params: AtlasFilterParamsExtended,
  skipPuan: boolean
): YokAtlasProgramEnriched[] {
  const y = params.year || "2025";
  const puanSet = skipPuan ? null : parsePuanSet(params.puanTipleri || []);
  const citySet =
    params.sehirler && params.sehirler.length
      ? Object.fromEntries(params.sehirler.map((c) => [c.trim(), true]))
      : null;
  const uniSet =
    params.universiteler && params.universiteler.length
      ? Object.fromEntries(params.universiteler.map((u) => [u.trim(), true]))
      : null;
  const bolumSet =
    params.bolumler && params.bolumler.length
      ? Object.fromEntries(params.bolumler.map((b) => [b.trim(), true]))
      : null;

  const out: YokAtlasProgramEnriched[] = [];
  for (const row of rows) {
    if (!rowHasYearData(row, y)) continue;
    if (puanSet) {
      const rpt = normPuanTip(row.Puan_Tipi);
      if (!puanSet[rpt]) continue;
    }
    if (citySet) {
      const sh = row.Sehir != null ? String(row.Sehir).trim() : "";
      if (!citySet[sh]) continue;
    }
    if (uniSet) {
      const display =
        row.universiteDisplay ?? formatUniversiteDisplayName(row.Universite ?? "");
      const raw = row.Universite != null ? String(row.Universite).trim() : "";
      if (!uniSet[display] && !uniSet[raw]) continue;
    }
    if (bolumSet) {
      const bolName = row.Bolum != null ? String(row.Bolum).trim() : "";
      if (!bolumSet[bolName]) continue;
    }
    const rank = parseRank(row[basariKey(y)]);
    if (params.bsMin != null) {
      if (rank == null || rank < params.bsMin) continue;
    }
    if (params.bsMax != null) {
      if (rank == null || rank > params.bsMax) continue;
    }
    if (!matchesKurum(row, params.kurum || "")) continue;
    if (!matchesOgrenim(row, params.ogrenim || "")) continue;
    if (!matchesBursFilter(row, params.burs || [])) continue;

    if (params.bolumDili?.length) {
      const dilSet = Object.fromEntries(params.bolumDili.map((d) => [d, true]));
      const dil = row.bolumDili ?? "turkce";
      if (!dilSet[dil]) continue;
    }

    if (params.depremKontenjan === "var" && !row.depremKontenjan) continue;
    if (params.depremKontenjan === "yok" && row.depremKontenjan) continue;

    if (params.search?.trim()) {
      const q = params.search.trim().toLocaleLowerCase("tr-TR");
      const haystack = row._search ?? enrichAtlasSearchRow(row)._search;
      if (!haystack.includes(q)) continue;
    }

    out.push(row);
  }
  return out;
}

function paginateExtended(
  rows: YokAtlasProgramEnriched[],
  params: AtlasFilterParamsExtended,
  puanRelaxed: boolean
): { rows: YokAtlasProgramEnriched[]; total: number; puanRelaxed: boolean } {
  const total = rows.length;
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? 50;
  const start = (page - 1) * pageSize;
  const paged = rows.slice(start, start + pageSize);
  return { rows: paged, total, puanRelaxed };
}

function filterExtendedAllRows(
  programs: YokAtlasProgramEnriched[],
  params: Omit<AtlasFilterParamsExtended, "page" | "pageSize">
): { rows: YokAtlasProgramEnriched[]; total: number; puanRelaxed: boolean } {
  let rows = collectFiltered(programs, params, false);
  let puanRelaxed = false;

  if (
    rows.length === 0 &&
    params.bolumler &&
    params.bolumler.length > 0 &&
    (!params.universiteler || params.universiteler.length === 0) &&
    params.puanTipleri &&
    params.puanTipleri.length > 0
  ) {
    rows = collectFiltered(programs, params, true);
    puanRelaxed = rows.length > 0;
  }

  return { rows, total: rows.length, puanRelaxed };
}

/** Tüm eşleşen satırlar — istemci sayfalama için */
export function filterAtlasProgramsExtendedAll(
  programs: YokAtlasProgramEnriched[],
  params: Omit<AtlasFilterParamsExtended, "page" | "pageSize">
): { rows: YokAtlasProgramEnriched[]; total: number; puanRelaxed: boolean } {
  return filterExtendedAllRows(programs, params);
}

export function filterAtlasProgramsExtended(
  programs: YokAtlasProgramEnriched[],
  params: AtlasFilterParamsExtended
): { rows: YokAtlasProgramEnriched[]; total: number; puanRelaxed: boolean } {
  const { rows, puanRelaxed } = filterExtendedAllRows(programs, params);
  return paginateExtended(rows, params, puanRelaxed);
}

/** İndeksli filtre — tam liste taraması yok */
export function filterAtlasProgramsExtendedIndexed(
  index: { filterExtended: (params: AtlasFilterParamsExtended, skipPuan?: boolean) => { rows: YokAtlasProgramEnriched[]; total: number } },
  params: AtlasFilterParamsExtended
): { rows: YokAtlasProgramEnriched[]; total: number; puanRelaxed: boolean } {
  let { rows } = index.filterExtended(params, false);
  let puanRelaxed = false;

  if (
    rows.length === 0 &&
    params.bolumler &&
    params.bolumler.length > 0 &&
    (!params.universiteler || params.universiteler.length === 0) &&
    params.puanTipleri &&
    params.puanTipleri.length > 0
  ) {
    const relaxed = index.filterExtended(params, true);
    rows = relaxed.rows;
    puanRelaxed = rows.length > 0;
  }

  return paginateExtended(rows, params, puanRelaxed);
}

export function filterAtlasPrograms(
  programs: YokAtlasProgram[],
  params: AtlasFilterParams
): YokAtlasProgram[] {
  const search = params.search?.trim().toLocaleLowerCase("tr-TR") || "";
  const puan = params.puanTipi?.trim().toUpperCase() || "";
  const sehir = params.sehir?.trim().toLocaleUpperCase("tr-TR") || "";
  const uni = params.universite?.trim().toLocaleUpperCase("tr-TR") || "";

  let list = programs.map(enrichAtlasSearchRow);

  if (search) {
    list = list.filter((p) => p._search.includes(search));
  }
  if (puan && puan !== "TÜMÜ" && puan !== "TUMU") {
    list = list.filter((p) =>
      String(p.Puan_Tipi || "")
        .toUpperCase()
        .includes(puan.replace("Ö", "O").replace("İ", "I"))
    );
  }
  if (sehir) {
    list = list.filter(
      (p) => String(p.Sehir || "").toLocaleUpperCase("tr-TR") === sehir
    );
  }
  if (uni) {
    list = list.filter((p) => {
      const display = String(
        p.universiteDisplay ?? formatUniversiteDisplayName(p.Universite ?? "")
      ).toLocaleUpperCase("tr-TR");
      const raw = String(p.Universite || "").toLocaleUpperCase("tr-TR");
      return display === uni || raw === uni || display.includes(uni) || raw.includes(uni);
    });
  }

  const limit = params.limit ?? 200;
  return list.slice(0, limit);
}

export function uniqueCities(programs: YokAtlasProgram[]): string[] {
  const set = new Set<string>();
  programs.forEach((p) => {
    const c = String(p.Sehir || "").trim();
    if (c) set.add(c);
  });
  return [...set].sort((a, b) => a.localeCompare(b, "tr"));
}

export function uniqueUniversities(programs: YokAtlasProgram[]): string[] {
  const set = new Set<string>();
  programs.forEach((p) => {
    const enriched = p as YokAtlasProgramEnriched;
    const display =
      enriched.universiteDisplay ?? formatUniversiteDisplayName(p.Universite ?? "");
    if (display) set.add(display);
  });
  return [...set].sort((a, b) => a.localeCompare(b, "tr"));
}

export function uniqueBolumler(programs: YokAtlasProgram[]): string[] {
  const set = new Set<string>();
  programs.forEach((p) => {
    const b = String(p.Bolum || "").trim();
    if (b) set.add(b);
  });
  return [...set].sort((a, b) => a.localeCompare(b, "tr"));
}

export function uniquePuanTipleri(programs: YokAtlasProgram[]): string[] {
  const set = new Set<string>();
  programs.forEach((p) => {
    const t = String(p.Puan_Tipi || "").trim();
    if (t) set.add(t);
  });
  return [...set].sort((a, b) => a.localeCompare(b, "tr"));
}
