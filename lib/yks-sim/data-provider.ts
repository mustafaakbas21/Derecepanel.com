import {
  loadAtlasPrograms as loadAtlasFromServer,
} from "@/lib/universities/atlas-server";
import type { YokAtlasProgram, UniversityDegreeLevel } from "@/lib/universities/types";

/** @deprecated Use `@/lib/universities/atlas-server` or `@/lib/yks-sim/atlas-cache`. */
export async function loadAtlasLisans(): Promise<YokAtlasProgram[]> {
  return loadAtlasFromServer("lisans");
}

/** @deprecated Use `@/lib/universities/atlas-server` or `@/lib/yks-sim/atlas-cache`. */
export async function loadAtlasOnlisans(): Promise<YokAtlasProgram[]> {
  return loadAtlasFromServer("onlisans");
}

export async function loadAtlasPrograms(
  level: UniversityDegreeLevel = "lisans"
): Promise<YokAtlasProgram[]> {
  return loadAtlasFromServer(level);
}

export async function loadAtlasAll(): Promise<YokAtlasProgram[]> {
  const [lisans, onlisans] = await Promise.all([
    loadAtlasFromServer("lisans"),
    loadAtlasFromServer("onlisans"),
  ]);
  return [...lisans, ...onlisans];
}
