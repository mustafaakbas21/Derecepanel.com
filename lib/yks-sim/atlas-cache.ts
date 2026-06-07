import { readFile } from "node:fs/promises";
import path from "node:path";

import { loadAtlasPrograms as loadRawAtlas } from "@/lib/universities/atlas-server";
import {
  enrichAtlasProgram,
  type YokAtlasProgramEnriched,
} from "@/lib/yks-sim/atlas-enrich";
import { buildAtlasSearchIndex, type AtlasSearchIndex } from "@/lib/yks-sim/atlas-index";
import {
  buildAtlasMetaFromRaw,
  type AtlasMetaSnapshot,
} from "@/lib/yks-sim/atlas-meta";
import { assignStrengthIndex } from "@/lib/yks-sim/net-resolve";
import type { UniversityDegreeLevel } from "@/lib/universities/types";

export type AtlasCacheLevel = UniversityDegreeLevel | "all";

export type { AtlasMetaSnapshot };

const enrichedCache: Partial<Record<AtlasCacheLevel, YokAtlasProgramEnriched[]>> = {};
const indexCache: Partial<Record<AtlasCacheLevel, AtlasSearchIndex>> = {};
const metaCache: Partial<Record<AtlasCacheLevel, AtlasMetaSnapshot>> = {};
let lisansProgramMap: Map<string, YokAtlasProgramEnriched> | null = null;
let lisansStrengthAssigned = false;

const META_FILE: Partial<Record<AtlasCacheLevel, string>> = {
  all: "yok-atlas-meta-all.json",
  lisans: "yok-atlas-meta-lisans.json",
  onlisans: "yok-atlas-meta-onlisans.json",
};

async function loadBundledMeta(level: AtlasCacheLevel): Promise<AtlasMetaSnapshot | null> {
  const name = META_FILE[level];
  if (!name) return null;
  try {
    const filePath = path.join(process.cwd(), "data", name);
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as AtlasMetaSnapshot;
  } catch {
    return null;
  }
}

function enrichAll(raw: Awaited<ReturnType<typeof loadRawAtlas>>): YokAtlasProgramEnriched[] {
  const out = new Array<YokAtlasProgramEnriched>(raw.length);
  for (let i = 0; i < raw.length; i++) {
    out[i] = enrichAtlasProgram(raw[i]!, i);
  }
  return out;
}

export async function getEnrichedAtlas(
  level: AtlasCacheLevel = "lisans"
): Promise<YokAtlasProgramEnriched[]> {
  if (enrichedCache[level]) return enrichedCache[level]!;

  if (level === "all") {
    const [lisans, onlisans] = await Promise.all([
      getEnrichedAtlas("lisans"),
      getEnrichedAtlas("onlisans"),
    ]);
    enrichedCache.all = lisans.concat(onlisans);
    indexCache.all = buildAtlasSearchIndex(enrichedCache.all);
    return enrichedCache.all;
  }

  const raw = await loadRawAtlas(level);
  const enriched = enrichAll(raw);
  enrichedCache[level] = enriched;
  indexCache[level] = buildAtlasSearchIndex(enriched);
  return enriched;
}

export async function getAtlasSearchIndex(
  level: AtlasCacheLevel = "all"
): Promise<AtlasSearchIndex> {
  if (indexCache[level]) return indexCache[level]!;
  await getEnrichedAtlas(level);
  return indexCache[level]!;
}

/** Meta: önce statik JSON, yoksa ham veriden (enrich yok) */
export async function getAtlasMetaCached(
  level: AtlasCacheLevel = "all"
): Promise<AtlasMetaSnapshot> {
  if (metaCache[level]) return metaCache[level]!;

  const bundled = await loadBundledMeta(level);
  if (bundled) {
    metaCache[level] = bundled;
    return bundled;
  }

  const built = await buildAtlasMetaFromRaw(level);
  metaCache[level] = built;
  return built;
}

/** Lisans program lookup + strength index (once per process). */
export async function getLisansProgramByKodu(
  programKodu: string
): Promise<YokAtlasProgramEnriched | undefined> {
  if (!lisansProgramMap) {
    const programs = await getEnrichedAtlas("lisans");
    if (!lisansStrengthAssigned) {
      assignStrengthIndex(programs);
      lisansStrengthAssigned = true;
    }
    lisansProgramMap = new Map();
    for (const p of programs) {
      const kod = String(p.Program_Kodu ?? "").trim();
      if (kod) lisansProgramMap.set(kod, p);
    }
  }
  return lisansProgramMap.get(programKodu.trim());
}
