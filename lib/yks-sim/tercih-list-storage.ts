import { panelGetItem, panelRemoveItem, panelSetItem } from "@/lib/panel-store";
import {
  formatGoalLabelFromTarget,
  getCurrentUser,
  primaryWriteId,
  saveStudentTargetForUser,
  storageKeyCandidates,
} from "@/lib/yks-sim/student-sim-bridge";
import type { StudentTargetPayload, YksSimUser } from "@/lib/yks-sim/types";
import type { YokAtlasProgram } from "@/lib/universities/types";
import { basariKey, tabanKey } from "@/lib/yks-sim/atlas-filter";
import type { YokAtlasProgramEnriched } from "@/lib/yks-sim/atlas-enrich";

export const TERCIH_LIST_CHANGE = "derece:tercih-list-change";

const LIST_KEY_PREFIX = "derece_tercih_list_v1_";

export type TercihListItem = {
  id: string;
  programKodu: string;
  sira: number;
  addedAt: string;
  year: string;
  universite: string;
  bolum: string;
  sehir?: string;
  puanTipi?: string;
  taban?: string;
  basari?: string;
  fakulteYO?: string;
  universiteDisplay?: string;
  bursTuru?: string;
  bolumDili?: string;
};

function listKeyForUser(u: YksSimUser | null): string {
  const id = primaryWriteId(u) || "anon";
  return `${LIST_KEY_PREFIX}${id}`;
}

function readRaw(key: string): TercihListItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = panelGetItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRaw(key: string, items: TercihListItem[]) {
  panelSetItem(key, JSON.stringify(items));
}

function normalizeSira(items: TercihListItem[]): TercihListItem[] {
  return items.map((item, i) => ({ ...item, sira: i + 1 }));
}

function dispatchChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TERCIH_LIST_CHANGE));
}

/** 1. sıradaki programı net sihirbazi «hedef» köprüsüne yansıt */
function syncPrimaryTarget(u: YksSimUser | null, items: TercihListItem[]) {
  const first = items.find((x) => x.sira === 1) ?? items[0];
  if (!first || !u) return;
  saveStudentTargetForUser(u, {
    universite: first.universite,
    bolum: first.bolum,
    fakulteYO: first.fakulteYO,
    sehir: first.sehir,
    puanTipi: first.puanTipi,
    programKodu: first.programKodu,
    taban: first.taban,
    basari: first.basari,
    year: first.year,
  });
}

export function readTercihList(u: YksSimUser | null = getCurrentUser()): TercihListItem[] {
  if (!u) return [];
  const keys = storageKeyCandidates(u);
  for (const k of keys) {
    const raw = readRaw(`${LIST_KEY_PREFIX}${k}`);
    if (raw.length) {
      return normalizeSira(raw.slice().sort((a, b) => a.sira - b.sira));
    }
  }
  const raw = readRaw(listKeyForUser(u));
  return normalizeSira(raw.slice().sort((a, b) => a.sira - b.sira));
}

export function saveTercihList(
  u: YksSimUser | null,
  items: TercihListItem[]
): boolean {
  if (!u || typeof window === "undefined") return false;
  const normalized = normalizeSira(items);
  const key = listKeyForUser(u);
  try {
    writeRaw(key, normalized);
    syncPrimaryTarget(u, normalized);
    dispatchChange();
    return true;
  } catch {
    return false;
  }
}

export function programToTercihListItem(
  p: YokAtlasProgram,
  year: string,
  enriched?: YokAtlasProgramEnriched
): Omit<TercihListItem, "id" | "sira" | "addedAt"> {
  return {
    programKodu: String(p.Program_Kodu ?? ""),
    year,
    universite: String(p.Universite ?? ""),
    bolum: String(p.Bolum ?? ""),
    fakulteYO: p.Fakulte_YO,
    sehir: p.Sehir,
    puanTipi: p.Puan_Tipi,
    taban: String(p[tabanKey(year)] ?? p.Taban_Puani_Guncel ?? ""),
    basari: String(p[basariKey(year)] ?? p.Basari_Sirasi_Guncel ?? ""),
    universiteDisplay: enriched?.universiteDisplay,
    bursTuru: enriched?.bursTuru,
    bolumDili: enriched?.bolumDili,
  };
}

export function addToTercihList(
  u: YksSimUser | null,
  p: YokAtlasProgram,
  year: string,
  enriched?: YokAtlasProgramEnriched
): { ok: boolean; reason?: "duplicate" | "no-user" | "storage" } {
  if (!u) return { ok: false, reason: "no-user" };
  const kod = String(p.Program_Kodu ?? "").trim();
  if (!kod) return { ok: false, reason: "storage" };
  const list = readTercihList(u);
  if (list.some((x) => x.programKodu === kod)) {
    return { ok: false, reason: "duplicate" };
  }
  const next: TercihListItem = {
    id: `tl-${Date.now().toString(36)}`,
    sira: list.length + 1,
    addedAt: new Date().toISOString(),
    ...programToTercihListItem(p, year, enriched),
  };
  return saveTercihList(u, [...list, next]) ? { ok: true } : { ok: false, reason: "storage" };
}

export function removeFromTercihList(u: YksSimUser | null, entryId: string): boolean {
  const list = readTercihList(u).filter((x) => x.id !== entryId);
  return saveTercihList(u, list);
}

export function moveTercihListEntry(
  u: YksSimUser | null,
  entryId: string,
  direction: "up" | "down"
): boolean {
  const list = readTercihList(u);
  const idx = list.findIndex((x) => x.id === entryId);
  if (idx < 0) return false;
  const swap = direction === "up" ? idx - 1 : idx + 1;
  if (swap < 0 || swap >= list.length) return false;
  const next = list.slice();
  [next[idx], next[swap]] = [next[swap], next[idx]];
  return saveTercihList(u, next);
}

export function moveTercihListToFirst(u: YksSimUser | null, entryId: string): boolean {
  const list = readTercihList(u);
  const item = list.find((x) => x.id === entryId);
  if (!item) return false;
  const rest = list.filter((x) => x.id !== entryId);
  return saveTercihList(u, [item, ...rest]);
}

/** Sürükle-bırak sonrası sırayı id listesine göre kaydet */
export function reorderTercihList(u: YksSimUser | null, orderedIds: string[]): boolean {
  const list = readTercihList(u);
  if (!orderedIds.length || orderedIds.length !== list.length) return false;
  const map = new Map(list.map((x) => [x.id, x]));
  const next = orderedIds.map((id) => map.get(id)).filter(Boolean) as TercihListItem[];
  if (next.length !== list.length) return false;
  return saveTercihList(u, next);
}

export function clearTercihList(u: YksSimUser | null): boolean {
  return saveTercihList(u, []);
}

export function formatTercihListSummary(items: TercihListItem[]): string {
  if (!items.length) return "";
  const first = items.find((x) => x.sira === 1) ?? items[0];
  const label = formatGoalLabelFromTarget({
    universite: first.universite,
    bolum: first.bolum,
    university: first.universite,
    department: first.bolum,
  } as StudentTargetPayload);
  if (items.length === 1) return label;
  return `${label} (+${items.length - 1} tercih)`;
}

export function isProgramInTercihList(
  items: TercihListItem[],
  programKodu: string
): TercihListItem | undefined {
  const kod = String(programKodu ?? "").trim();
  return items.find((x) => x.programKodu === kod);
}
