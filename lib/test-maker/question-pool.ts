import { STORAGE_KEYS } from "@/lib/test-maker/constants";
import { panelGetItem, panelRemoveItem, panelSetItem } from "@/lib/panel-store";
import {
  dbClear,
  dbDelete,
  dbGetAll,
  dbPutMany,
  dbReplaceAll,
  dbUpdateMeta,
} from "@/lib/test-maker/question-pool-db";
import type { AnswerLetter, QuestionPoolItem } from "@/lib/test-maker/types";

/** Eski demo kayıtları (q_seed_*) */
function isLegacySeedItem(item: QuestionPoolItem): boolean {
  if (item.uuid.startsWith("q_seed_")) return true;
  const url = item.dataUrl ?? "";
  if (!url.startsWith("data:image/svg+xml,")) return false;
  try {
    return decodeURIComponent(url).includes(">Soru</text>");
  } catch {
    return false;
  }
}

export type PoolFilters = {
  dersName?: string;
  konuName?: string;
  kavramName?: string;
  answerMode?: "all" | "answered" | "unanswered" | AnswerLetter;
};

export const QUESTION_POOL_UPDATED_EVENT = "derece:question-pool-updated";

let poolCache: QuestionPoolItem[] | null = null;
let initPromise: Promise<QuestionPoolItem[]> | null = null;

function notifyPoolUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(QUESTION_POOL_UPDATED_EVENT));
}

function syncLsIndex(list: QuestionPoolItem[]) {
  if (typeof window === "undefined") return;
  try {
    const index = list.map(({ uuid, ders, konu, kavram, savedAt, answer }) => ({
      uuid,
      ders,
      konu,
      kavram,
      savedAt,
      answer,
    }));
    panelSetItem(STORAGE_KEYS.questionPool, JSON.stringify(index));
  } catch {
    /* Appwrite birincil — panel-store indeks */
  }
}

function readLegacyLocalStorage(): QuestionPoolItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = panelGetItem(STORAGE_KEYS.questionPool);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QuestionPoolItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => !isLegacySeedItem(item));
  } catch {
    return [];
  }
}

async function migrateLegacyLocalStorageIfNeeded(): Promise<void> {
  if (typeof window === "undefined") return;
  if (panelGetItem(STORAGE_KEYS.questionPoolIdbMigrated) === "1") return;

  const legacy = readLegacyLocalStorage();
  const withImages = legacy.filter(
    (item) => typeof item.dataUrl === "string" && item.dataUrl.length > 64
  );

  if (withImages.length > 0) {
    await dbReplaceAll(withImages.filter((item) => !isLegacySeedItem(item)));
  }

  panelSetItem(STORAGE_KEYS.questionPoolIdbMigrated, "1");
  syncLsIndex(withImages);
}

export function createPoolUuid() {
  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** İlk yükleme — Appwrite + eski localStorage/IndexedDB migrasyonu */
export async function ensureQuestionPoolInit(): Promise<QuestionPoolItem[]> {
  if (poolCache) return poolCache;
  if (typeof window === "undefined") return [];
  if (!initPromise) {
    initPromise = (async () => {
      await migrateLegacyLocalStorageIfNeeded();
      poolCache = await dbGetAll();
      syncLsIndex(poolCache);
      return poolCache;
    })().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

/** Senkron okuma — init sonrası önbellek; aksi halde legacy LS */
export function loadQuestionPool(): QuestionPoolItem[] {
  if (poolCache) return poolCache;
  return readLegacyLocalStorage();
}

export async function loadQuestionPoolAsync(): Promise<QuestionPoolItem[]> {
  return ensureQuestionPoolInit();
}

export async function persistQuestionPool(list: QuestionPoolItem[]): Promise<void> {
  await dbReplaceAll(list);
  poolCache = list;
  syncLsIndex(list);
  notifyPoolUpdated();
}

export async function listPool(_coachId?: string, filters?: PoolFilters): Promise<QuestionPoolItem[]> {
  const list = await ensureQuestionPoolInit();
  return getFilteredFromList(list, filters);
}

function getFilteredFromList(list: QuestionPoolItem[], filters?: PoolFilters): QuestionPoolItem[] {
  if (!filters) return list;
  return list.filter((q) => {
    if (filters.dersName && q.ders !== filters.dersName) return false;
    if (filters.konuName && q.konu !== filters.konuName) return false;
    if (filters.kavramName && q.kavram !== filters.kavramName) return false;
    if (filters.answerMode === "answered" && !q.answer) return false;
    if (filters.answerMode === "unanswered" && q.answer) return false;
    if (
      filters.answerMode &&
      ["A", "B", "C", "D", "E"].includes(filters.answerMode) &&
      q.answer !== filters.answerMode
    ) {
      return false;
    }
    return true;
  });
}

export function getFiltered(filters?: PoolFilters): QuestionPoolItem[] {
  return getFilteredFromList(loadQuestionPool(), filters);
}

export async function appendToPool(items: QuestionPoolItem[]): Promise<void> {
  await ensureQuestionPoolInit();
  await dbPutMany(items);
  poolCache = [...items, ...(poolCache ?? [])];
  syncLsIndex(poolCache);
  notifyPoolUpdated();
}

export async function updateAnswer(uuid: string, answer: AnswerLetter | null): Promise<QuestionPoolItem[]> {
  await ensureQuestionPoolInit();
  const list = poolCache ?? [];
  const item = list.find((x) => x.uuid === uuid);
  if (!item) return list;
  item.answer = answer;
  await dbUpdateMeta(uuid, { answer });
  syncLsIndex(list);
  notifyPoolUpdated();
  return list;
}

export async function deleteFromPool(uuid: string): Promise<QuestionPoolItem[]> {
  await ensureQuestionPoolInit();
  await dbDelete(uuid);
  poolCache = (poolCache ?? []).filter((x) => x.uuid !== uuid);
  syncLsIndex(poolCache);
  notifyPoolUpdated();
  return poolCache;
}

export async function clearPool(_coachId?: string): Promise<void> {
  await dbClear();
  poolCache = [];
  if (typeof window !== "undefined") {
    panelRemoveItem(STORAGE_KEYS.questionPool);
  }
  notifyPoolUpdated();
}

export function setPoolAnswer(uuid: string, answer: AnswerLetter | null) {
  return updateAnswer(uuid, answer);
}

export async function bulkAddToPool(
  items: Omit<QuestionPoolItem, "uuid" | "savedAt">[]
): Promise<QuestionPoolItem[]> {
  await ensureQuestionPoolInit();
  const stamped: QuestionPoolItem[] = items.map((item) => ({
    ...item,
    uuid: createPoolUuid(),
    savedAt: new Date().toISOString(),
  }));
  await dbPutMany(stamped);
  poolCache = [...stamped, ...(poolCache ?? [])];
  syncLsIndex(poolCache);
  notifyPoolUpdated();
  return poolCache;
}
