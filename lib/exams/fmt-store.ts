import { panelGetItem, panelRemoveItem, panelSetItem } from "@/lib/panel-store";
import {
  ACTIVE_TEMPLATE_LS_KEY,
  FMT_STORE_CHANGE,
  OPTIK_TEMPLATES_LS_KEY,
} from "@/lib/exams/constants";
import { buildParserTemplate } from "@/lib/exams/exam-parser";
import type { ParserTemplate } from "@/lib/exams/types";
import { readJsonArray, writeJson } from "@/lib/exams/local-storage";
import {
  cloudArchiveList,
  cloudArchivePut,
} from "@/lib/appwrite/archive-client";

const DB_NAME = "derecepanel_db";
const DB_VERSION = 1;
const STORE = "fmt_templates";
const FMT_CLOUD_MIGRATED_KEY = "derece_fmt_cloud_v1";

export type FmtRecord = Record<string, unknown> & {
  id: string;
  label?: string;
  updatedAt?: number;
  builtin?: boolean;
};

let dbPromise: Promise<IDBDatabase> | null = null;
let legacyMigrated = false;

export function dispatchFmtStoreChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(FMT_STORE_CHANGE));
}

export function onFmtStoreChange(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const fn = () => handler();
  window.addEventListener(FMT_STORE_CHANGE, fn);
  return () => window.removeEventListener(FMT_STORE_CHANGE, fn);
}

/** ESKİ `derece_optik_fmt_repo` → IndexedDB (tek sefer) */
export async function migrateLegacyFmtRepo(): Promise<void> {
  if (legacyMigrated || typeof window === "undefined") return;
  legacyMigrated = true;
  try {
    const raw = panelGetItem("derece_optik_fmt_repo");
    if (!raw) return;
    const arr = JSON.parse(raw) as FmtRecord[];
    if (!Array.isArray(arr) || !arr.length) {
      panelRemoveItem("derece_optik_fmt_repo");
      return;
    }
    const existing = await fmtListAll();
    const have = new Set(existing.map((x) => x.id));
    for (const item of arr) {
      if (!item?.id || have.has(item.id) || item.builtin) continue;
      const rec: FmtRecord = { ...item, builtin: false };
      if (!Array.isArray(rec.nameRange) && Array.isArray(rec.name)) {
        rec.nameRange = rec.name as [number, number | null];
      }
      await fmtPut(rec);
      have.add(rec.id);
    }
    panelRemoveItem("derece_optik_fmt_repo");
  } catch {
    /* sessiz */
  }
}

function openDb(): Promise<IDBDatabase> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB yalnızca tarayıcıda"));
  }
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB desteklenmiyor"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE)) {
        const s = db.createObjectStore(STORE, { keyPath: "id" });
        s.createIndex("updatedAt", "updatedAt", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB açılamadı"));
  });
  return dbPromise;
}

async function tx(mode: IDBTransactionMode): Promise<IDBObjectStore> {
  const db = await openDb();
  return db.transaction(STORE, mode).objectStore(STORE);
}

async function migrateFmtIdbToCloud(): Promise<void> {
  if (typeof window === "undefined") return;
  if (panelGetItem(FMT_CLOUD_MIGRATED_KEY) === "1") return;

  try {
    const store = await tx("readonly");
    const records = await new Promise<FmtRecord[]>((resolve, reject) => {
      const out: FmtRecord[] = [];
      const req = store.openCursor();
      req.onsuccess = (e) => {
        const c = (e.target as IDBRequest<IDBCursorWithValue>).result;
        if (!c) {
          resolve(out);
          return;
        }
        out.push(c.value as FmtRecord);
        c.continue();
      };
      req.onerror = () => reject(req.error);
    });

    for (const rec of records) {
      if (!rec?.id || rec.builtin) continue;
      await cloudArchivePut({
        scope: "fmt",
        id: rec.id,
        payload: JSON.stringify(rec),
      });
    }

    panelSetItem(FMT_CLOUD_MIGRATED_KEY, "1");
  } catch {
    /* tekrar dene */
  }
}

export async function fmtListAll(): Promise<FmtRecord[]> {
  await migrateFmtIdbToCloud();
  try {
    const items = await cloudArchiveList("fmt");
    const out = items
      .map((item) => {
        try {
          return JSON.parse(item.payload) as FmtRecord;
        } catch {
          return null;
        }
      })
      .filter((x): x is FmtRecord => !!x?.id);

    if (out.length) {
      out.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      return out;
    }
  } catch {
    /* fallback */
  }
  return readLsTemplates();
}

function readLsTemplates(): FmtRecord[] {
  return readJsonArray<FmtRecord>(OPTIK_TEMPLATES_LS_KEY);
}

export async function fmtGet(id: string): Promise<FmtRecord | null> {
  const list = await fmtListAll();
  return list.find((t) => t.id === id) ?? null;
}

export async function fmtPut(fmt: FmtRecord): Promise<FmtRecord> {
  if (!fmt?.id) throw new Error("FMT.id gerekli");
  fmt.updatedAt = Date.now();

  if (!fmt.builtin) {
    await cloudArchivePut({
      scope: "fmt",
      id: fmt.id,
      payload: JSON.stringify(fmt),
    });
  } else {
    const list = readLsTemplates().filter((t) => t.id !== fmt.id);
    list.unshift(fmt);
    writeJson(OPTIK_TEMPLATES_LS_KEY, list);
  }

  dispatchFmtStoreChange();
  return fmt;
}

export function getActiveTemplateId(): string {
  if (typeof window === "undefined") return "";
  return String(panelGetItem(ACTIVE_TEMPLATE_LS_KEY) || "").trim();
}

export function setActiveTemplateId(id: string) {
  if (typeof window === "undefined") return;
  panelSetItem(ACTIVE_TEMPLATE_LS_KEY, id);
}

/** Varsayılan TSV şablonu — Stüdyo boşsa */
export const DEFAULT_TABBED_TEMPLATE: FmtRecord = {
  id: "default-tabbed",
  label: "TSV / Sekmeli (No, Ad, Kitapçık, Cevaplar)",
  tabbed: true,
  minLine: 10,
  builtin: true,
  updatedAt: Date.now(),
};

export async function loadParserTemplates(): Promise<
  { id: string; label: string; template: ParserTemplate }[]
> {
  await migrateLegacyFmtRepo();
  let items = await fmtListAll();
  const hasDefault = items.some((i) => i.id === DEFAULT_TABBED_TEMPLATE.id);
  if (!hasDefault) items = [...items, DEFAULT_TABBED_TEMPLATE];

  const out: { id: string; label: string; template: ParserTemplate }[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) continue;
    const tpl = buildParserTemplate(item);
    if (!tpl) continue;
    seen.add(item.id);
    out.push({ id: item.id, label: tpl.label, template: tpl });
  }

  if (!out.length) {
    const fallback = buildParserTemplate(DEFAULT_TABBED_TEMPLATE);
    if (fallback) {
      out.push({
        id: DEFAULT_TABBED_TEMPLATE.id,
        label: fallback.label,
        template: fallback,
      });
    }
  }

  return out;
}

export async function resolveActiveParserTemplate(): Promise<{
  id: string;
  template: ParserTemplate;
} | null> {
  const activeId = getActiveTemplateId();
  const list = await loadParserTemplates();
  const pick = activeId ? list.find((t) => t.id === activeId) : list[0];
  return pick ? { id: pick.id, template: pick.template } : null;
}
