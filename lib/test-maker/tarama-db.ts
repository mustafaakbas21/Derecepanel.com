import { STORAGE_KEYS, TARAMA_DB } from "@/lib/test-maker/constants";
import type { TaramaExportMeta, TaramaRecord } from "@/lib/test-maker/types";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(new Error("IndexedDB desteklenmiyor"));
      return;
    }
    const req = indexedDB.open(TARAMA_DB.name, TARAMA_DB.version);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(TARAMA_DB.store)) {
        const store = db.createObjectStore(TARAMA_DB.store, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("DB açılamadı"));
  });
}

export async function taramaGet(id: string): Promise<TaramaRecord | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TARAMA_DB.store, "readonly");
    const req = tx.objectStore(TARAMA_DB.store).get(id);
    req.onsuccess = () => resolve((req.result as TaramaRecord) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function taramaPut(rec: TaramaRecord): Promise<TaramaRecord> {
  const db = await openDb();
  const now = Date.now();
  const full: TaramaRecord = {
    ...rec,
    createdAt: rec.createdAt ?? now,
    updatedAt: now,
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TARAMA_DB.store, "readwrite");
    const req = tx.objectStore(TARAMA_DB.store).put(full);
    req.onsuccess = () => resolve(full);
    req.onerror = () => reject(req.error);
  });
}

export function genTaramaId() {
  return `trm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function loadExportMeta(): TaramaExportMeta[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.exports);
    return raw ? (JSON.parse(raw) as TaramaExportMeta[]) : [];
  } catch {
    return [];
  }
}

export function pushExportMeta(meta: TaramaExportMeta) {
  const list = loadExportMeta();
  list.unshift(meta);
  localStorage.setItem(STORAGE_KEYS.exports, JSON.stringify(list.slice(0, 80)));
}
