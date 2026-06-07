import { STORAGE_KEYS, TARAMA_DB } from "@/lib/taramalar/constants";
import type { TaramaExportMeta, TaramaRecord } from "@/lib/taramalar/types";

import {
  cloudArchiveDelete,
  cloudArchiveList,
  cloudArchivePut,
} from "@/lib/appwrite/archive-client";
import { panelGetItem, panelSetItem } from "@/lib/panel-store";

const MIGRATED_KEY = "derece_tarama_cloud_v1";

async function migrateLegacyIdbIfNeeded(): Promise<void> {
  if (typeof window === "undefined") return;
  if (panelGetItem(MIGRATED_KEY) === "1") return;

  try {
    if (!("indexedDB" in window)) {
      panelSetItem(MIGRATED_KEY, "1");
      return;
    }

    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(TARAMA_DB.name, TARAMA_DB.version);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    const records = await new Promise<TaramaRecord[]>((resolve, reject) => {
      const tx = db.transaction(TARAMA_DB.store, "readonly");
      const req = tx.objectStore(TARAMA_DB.store).getAll();
      req.onsuccess = () => resolve((req.result as TaramaRecord[]) || []);
      req.onerror = () => reject(req.error);
    });

    for (const rec of records) {
      if (!rec?.id) continue;
      await cloudArchivePut({
        scope: "tarama",
        id: rec.id,
        payload: JSON.stringify(rec),
      });
    }

    panelSetItem(MIGRATED_KEY, "1");
  } catch {
    /* tekrar dene */
  }
}

export async function taramaGet(id: string): Promise<TaramaRecord | null> {
  await migrateLegacyIdbIfNeeded();
  const items = await cloudArchiveList("tarama");
  const item = items.find((x) => x.id === id);
  if (!item) return null;
  try {
    return JSON.parse(item.payload) as TaramaRecord;
  } catch {
    return null;
  }
}

export async function taramaPut(rec: TaramaRecord): Promise<TaramaRecord> {
  await migrateLegacyIdbIfNeeded();
  const now = Date.now();
  const full: TaramaRecord = {
    ...rec,
    createdAt: rec.createdAt ?? now,
    updatedAt: now,
  };

  await cloudArchivePut({
    scope: "tarama",
    id: full.id,
    payload: JSON.stringify(full),
  });

  return full;
}

export async function taramaList(): Promise<TaramaRecord[]> {
  await migrateLegacyIdbIfNeeded();
  const items = await cloudArchiveList("tarama");
  const list = items
    .map((item) => {
      try {
        return JSON.parse(item.payload) as TaramaRecord;
      } catch {
        return null;
      }
    })
    .filter((x): x is TaramaRecord => !!x);

  list.sort((a, b) => (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt));
  return list;
}

export async function taramaDelete(id: string): Promise<void> {
  await cloudArchiveDelete("tarama", id);
}

export function genTaramaId() {
  return `trm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function loadExportMeta(): TaramaExportMeta[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = panelGetItem(STORAGE_KEYS.exports);
    return raw ? (JSON.parse(raw) as TaramaExportMeta[]) : [];
  } catch {
    return [];
  }
}

export function pushExportMeta(meta: TaramaExportMeta) {
  const list = loadExportMeta();
  const next = list.filter((x) => x.id !== meta.id);
  next.unshift(meta);
  panelSetItem(STORAGE_KEYS.exports, JSON.stringify(next.slice(0, 500)));
}
