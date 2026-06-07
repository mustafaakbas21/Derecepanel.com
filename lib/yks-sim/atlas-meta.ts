import { loadAtlasPrograms } from "@/lib/universities/atlas-server";
import { formatUniversiteDisplayName } from "@/lib/yks-sim/atlas-program-display";
import type { YokAtlasProgram } from "@/lib/universities/types";
import type { AtlasCacheLevel } from "@/lib/yks-sim/atlas-cache";

export type AtlasMetaSnapshot = {
  cities: string[];
  universities: string[];
  bolumler: string[];
  puanTipleri: string[];
  total: number;
};

/** Ham atlas satırlarından meta — enrich yok, tek geçiş */
export async function buildAtlasMetaFromRaw(
  level: AtlasCacheLevel = "all"
): Promise<AtlasMetaSnapshot> {
  let programs: YokAtlasProgram[] = [];
  if (level === "all") {
    const [lisans, onlisans] = await Promise.all([
      loadAtlasPrograms("lisans"),
      loadAtlasPrograms("onlisans"),
    ]);
    programs = lisans.concat(onlisans);
  } else {
    programs = await loadAtlasPrograms(level);
  }

  const cities = new Set<string>();
  const universities = new Set<string>();
  const bolumler = new Set<string>();
  const puanTipleri = new Set<string>();

  for (const p of programs) {
    const c = String(p.Sehir ?? "").trim();
    if (c) cities.add(c);
    const u = String(p.Universite ?? "").trim();
    if (u) universities.add(formatUniversiteDisplayName(u));
    const b = String(p.Bolum ?? "").trim();
    if (b) bolumler.add(b);
    const pt = String(p.Puan_Tipi ?? "").trim();
    if (pt) puanTipleri.add(pt);
  }

  const sortTr = (a: string, b: string) => a.localeCompare(b, "tr-TR");
  return {
    cities: [...cities].sort(sortTr),
    universities: [...universities].sort(sortTr),
    bolumler: [...bolumler].sort(sortTr),
    puanTipleri: [...puanTipleri].sort(sortTr),
    total: programs.length,
  };
}
