import { RECETE_DB } from "@/lib/hata-recetesi/constants";
import type { RecipeArchiveRecord } from "@/lib/hata-recetesi/types";

import {
  cloudArchiveDelete,
  cloudArchiveList,
  cloudArchivePut,
} from "@/lib/appwrite/archive-client";
import { panelGetItem, panelSetItem } from "@/lib/panel-store";

const MIGRATED_KEY = "derece_recete_cloud_v1";

async function migrateLegacyIdbIfNeeded(): Promise<void> {
  if (typeof window === "undefined") return;
  if (panelGetItem(MIGRATED_KEY) === "1") return;

  try {
    if (!("indexedDB" in window)) {
      panelSetItem(MIGRATED_KEY, "1");
      return;
    }

    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(RECETE_DB.name, RECETE_DB.version);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    const records = await new Promise<RecipeArchiveRecord[]>((resolve, reject) => {
      const tx = db.transaction(RECETE_DB.store, "readonly");
      const req = tx.objectStore(RECETE_DB.store).getAll();
      req.onsuccess = () => resolve((req.result as RecipeArchiveRecord[]) || []);
      req.onerror = () => reject(req.error);
    });

    for (const rec of records) {
      if (!rec?.id) continue;
      await cloudArchivePut({
        scope: "recete",
        id: rec.id,
        payload: JSON.stringify(rec),
      });
    }

    panelSetItem(MIGRATED_KEY, "1");
  } catch {
    /* tekrar dene */
  }
}

export async function receteList(): Promise<RecipeArchiveRecord[]> {
  await migrateLegacyIdbIfNeeded();
  const items = await cloudArchiveList("recete");
  const list = items
    .map((item) => {
      try {
        return JSON.parse(item.payload) as RecipeArchiveRecord;
      } catch {
        return null;
      }
    })
    .filter((x): x is RecipeArchiveRecord => !!x);

  list.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  return list;
}

export async function receteGet(id: string): Promise<RecipeArchiveRecord | null> {
  await migrateLegacyIdbIfNeeded();
  const items = await cloudArchiveList("recete");
  const item = items.find((x) => x.id === id);
  if (!item) return null;
  try {
    return JSON.parse(item.payload) as RecipeArchiveRecord;
  } catch {
    return null;
  }
}

export async function recetePut(rec: RecipeArchiveRecord): Promise<RecipeArchiveRecord> {
  await migrateLegacyIdbIfNeeded();
  const now = Date.now();
  const full: RecipeArchiveRecord = {
    ...rec,
    createdAt: rec.createdAt ?? now,
    updatedAt: now,
    questionCount: rec.questions?.length ?? rec.questionCount ?? 0,
    thumbs: rec.thumbs ?? rec.questions?.slice(0, 4).map((q) => q.imageDataUrl),
  };

  await cloudArchivePut({
    scope: "recete",
    id: full.id,
    payload: JSON.stringify(full),
  });

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("hata-recetesi:recete-deposu-change"));
  }

  return full;
}

export async function receteDelete(id: string): Promise<void> {
  await cloudArchiveDelete("recete", id);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("hata-recetesi:recete-deposu-change"));
  }
}

export function genReceteId() {
  return `rcp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
