import {
  matchesBursFilter,
  matchesKurum,
  matchesOgrenim,
  normPuanTip,
  type YokAtlasProgramEnriched,
} from "@/lib/yks-sim/atlas-enrich";
import {
  basariKey,
  enrichAtlasSearchRow,
  parseRank,
  rowHasYearData,
  type AtlasFilterParamsExtended,
} from "@/lib/yks-sim/atlas-filter";
import type { BolumDili } from "@/lib/yks-sim/atlas-program-display";
import { formatUniversiteDisplayName } from "@/lib/yks-sim/atlas-program-display";

function pushIndex(map: Map<string, number[]>, key: string, idx: number) {
  if (!key) return;
  const arr = map.get(key);
  if (arr) arr.push(idx);
  else map.set(key, [idx]);
}

function intersect(a: Set<number>, b: Set<number>): Set<number> {
  if (a.size > b.size) [a, b] = [b, a];
  const out = new Set<number>();
  for (const x of a) {
    if (b.has(x)) out.add(x);
  }
  return out;
}

function unionFromMap(map: Map<string, number[]>, keys: string[]): Set<number> {
  const out = new Set<number>();
  for (const k of keys) {
    const list = map.get(k);
    if (list) for (const i of list) out.add(i);
  }
  return out;
}

export type AtlasSearchIndex = {
  programs: YokAtlasProgramEnriched[];
  filterExtended: (
    params: AtlasFilterParamsExtended,
    skipPuan?: boolean
  ) => { rows: YokAtlasProgramEnriched[]; total: number };
};

export function buildAtlasSearchIndex(
  programs: YokAtlasProgramEnriched[]
): AtlasSearchIndex {
  const byPuan = new Map<string, number[]>();
  const byCity = new Map<string, number[]>();
  const byUniDisplay = new Map<string, number[]>();
  const byUniRaw = new Map<string, number[]>();
  const byBolum = new Map<string, number[]>();
  const byYear = new Map<string, number[]>();

  for (let i = 0; i < programs.length; i++) {
    const row = programs[i];
    const puan = normPuanTip(String(row.Puan_Tipi ?? ""));
    pushIndex(byPuan, puan, i);

    const city = String(row.Sehir ?? "").trim();
    pushIndex(byCity, city, i);

    const rawUni = String(row.Universite ?? "").trim();
    pushIndex(byUniRaw, rawUni, i);
    const display =
      row.universiteDisplay ?? formatUniversiteDisplayName(rawUni);
    pushIndex(byUniDisplay, display, i);

    const bolum = String(row.Bolum ?? "").trim();
    pushIndex(byBolum, bolum, i);

    for (const y of ["2025", "2024", "2023"]) {
      if (rowHasYearData(row, y)) pushIndex(byYear, y, i);
    }
  }

  function collectFiltered(
    params: AtlasFilterParamsExtended,
    skipPuan: boolean
  ): YokAtlasProgramEnriched[] {
    const y = params.year || "2025";
    let candidates = new Set(byYear.get(y) ?? []);

    if (!skipPuan && params.puanTipleri?.length) {
      const normalized = params.puanTipleri.map((p) => normPuanTip(p)).filter(Boolean);
      candidates = intersect(candidates, unionFromMap(byPuan, normalized));
    }

    if (params.sehirler?.length) {
      candidates = intersect(candidates, unionFromMap(byCity, params.sehirler));
    }

    if (params.universiteler?.length) {
      const uniSet = new Set<number>();
      for (const u of params.universiteler) {
        const d = byUniDisplay.get(u);
        const r = byUniRaw.get(u);
        if (d) for (const i of d) uniSet.add(i);
        if (r) for (const i of r) uniSet.add(i);
      }
      candidates = intersect(candidates, uniSet);
    }

    if (params.bolumler?.length) {
      candidates = intersect(candidates, unionFromMap(byBolum, params.bolumler));
    }

    const searchQ = params.search?.trim().toLocaleLowerCase("tr-TR") ?? "";
    const out: YokAtlasProgramEnriched[] = [];

    for (const i of candidates) {
      const row = programs[i];
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
        const dilSet = Object.fromEntries(
          params.bolumDili.map((d: BolumDili) => [d, true])
        );
        const dil = row.bolumDili ?? "turkce";
        if (!dilSet[dil]) continue;
      }

      if (params.depremKontenjan === "var" && !row.depremKontenjan) continue;
      if (params.depremKontenjan === "yok" && row.depremKontenjan) continue;

      if (searchQ) {
        const haystack = row._search ?? enrichAtlasSearchRow(row)._search;
        if (!haystack?.includes(searchQ)) continue;
      }

      out.push(row);
    }

    return out;
  }

  return {
    programs,
    filterExtended: (params, skipPuan = false) => {
      const rows = collectFiltered(params, skipPuan);
      return { rows, total: rows.length };
    },
  };
}
