import { readFile } from "node:fs/promises";
import path from "node:path";

import type {
  UniversityDegreeLevel,
  UniversityListItem,
  YokAtlasProgram,
} from "@/lib/universities/types";

export const YOK_ATLAS_LISANS_PATH = "data/yok-atlas-lisans.json";
export const YOK_ATLAS_ONLISANS_PATH = "data/yok-atlas-onlisans.json";

const cache: Partial<Record<UniversityDegreeLevel, YokAtlasProgram[]>> = {};
const namesCache: Partial<Record<UniversityDegreeLevel, UniversityListItem[]>> = {};
const departmentsCache = new Map<string, string[]>();

function dataPath(file: string) {
  return path.join(process.cwd(), file);
}

export async function loadAtlasPrograms(
  level: UniversityDegreeLevel
): Promise<YokAtlasProgram[]> {
  if (cache[level]) return cache[level]!;

  const file =
    level === "lisans" ? YOK_ATLAS_LISANS_PATH : YOK_ATLAS_ONLISANS_PATH;
  const raw = await readFile(dataPath(file), "utf-8");
  const parsed = JSON.parse(raw) as YokAtlasProgram[];
  cache[level] = Array.isArray(parsed) ? parsed : [];
  return cache[level]!;
}

export async function getUniversityList(
  level: UniversityDegreeLevel
): Promise<UniversityListItem[]> {
  if (namesCache[level]) return namesCache[level]!;

  const programs = await loadAtlasPrograms(level);
  const map = new Map<string, { sehir: string; count: number }>();

  for (const p of programs) {
    const name = (p.Universite ?? "").trim();
    if (!name) continue;
    const prev = map.get(name);
    map.set(name, {
      sehir: prev?.sehir || (p.Sehir ?? "").trim(),
      count: (prev?.count ?? 0) + 1,
    });
  }

  const list = [...map.entries()]
    .map(([name, meta]) => ({
      name,
      sehir: meta.sehir,
      programCount: meta.count,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "tr"));

  namesCache[level] = list;
  return list;
}

export async function getUniversityNames(level: UniversityDegreeLevel): Promise<string[]> {
  const list = await getUniversityList(level);
  return list.map((u) => u.name);
}

export async function getDepartmentsForUniversity(
  level: UniversityDegreeLevel,
  university: string
): Promise<string[]> {
  const key = `${level}::${university.trim().toUpperCase()}`;
  if (departmentsCache.has(key)) return departmentsCache.get(key)!;

  const programs = await loadAtlasPrograms(level);
  const uni = university.trim().toUpperCase();
  const set = new Set<string>();

  for (const p of programs) {
    if ((p.Universite ?? "").trim().toUpperCase() === uni) {
      const bolum = (p.Bolum ?? "").trim();
      if (bolum) set.add(bolum);
    }
  }

  const list = [...set].sort((a, b) => a.localeCompare(b, "tr"));
  departmentsCache.set(key, list);
  return list;
}

/** Görünen üniversite adı (şehir bilgisiyle) */
export function formatUniversityLabel(name: string, sehir?: string): string {
  const s = (sehir ?? "").trim();
  return s ? `${name} (${s})` : name;
}
