import { STORAGE_KEYS } from "@/lib/test-maker/constants";
import type { AnswerLetter, QuestionPoolItem } from "@/lib/test-maker/types";

const PLACEHOLDER =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><rect fill="#f1f5f9" width="320" height="200"/><text x="160" y="100" text-anchor="middle" fill="#64748b" font-size="14">Soru</text></svg>'
  );

const SEED: QuestionPoolItem[] = [
  {
    uuid: "q_seed_1",
    dataUrl: PLACEHOLDER,
    ders: "TYT Matematik",
    konu: "Türev",
    kavram: "Zincir Kuralı",
    answer: "C",
    savedAt: new Date().toISOString(),
  },
  {
    uuid: "q_seed_2",
    dataUrl: PLACEHOLDER,
    ders: "TYT Matematik",
    konu: "Limit",
    kavram: "Belirsizlik",
    answer: "A",
    savedAt: new Date().toISOString(),
  },
  {
    uuid: "q_seed_3",
    dataUrl: PLACEHOLDER,
    ders: "TYT Türkçe",
    konu: "Paragraf",
    kavram: "Ana düşünce",
    answer: "B",
    savedAt: new Date().toISOString(),
  },
];

export type PoolFilters = {
  dersName?: string;
  konuName?: string;
  kavramName?: string;
  answerMode?: "all" | "answered" | "unanswered" | AnswerLetter;
};

export function createPoolUuid() {
  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function readRaw(): QuestionPoolItem[] {
  if (typeof window === "undefined") return [...SEED];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.questionPool);
    if (raw) {
      const parsed = JSON.parse(raw) as QuestionPoolItem[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* ignore */
  }
  persistQuestionPool(SEED);
  return [...SEED];
}

export function persistQuestionPool(list: QuestionPoolItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.questionPool, JSON.stringify(list));
  } catch {
    throw new Error("STORAGE_FULL");
  }
}

export function loadQuestionPool(): QuestionPoolItem[] {
  return readRaw();
}

export async function listPool(_coachId?: string, filters?: PoolFilters): Promise<QuestionPoolItem[]> {
  return getFiltered(filters);
}

export function getFiltered(filters?: PoolFilters): QuestionPoolItem[] {
  const list = readRaw();
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

export async function appendToPool(items: QuestionPoolItem[]): Promise<void> {
  const list = readRaw();
  persistQuestionPool([...items, ...list]);
}

export async function updateAnswer(uuid: string, answer: AnswerLetter | null): Promise<QuestionPoolItem[]> {
  const list = readRaw();
  const item = list.find((x) => x.uuid === uuid);
  if (!item) return list;
  item.answer = answer;
  persistQuestionPool(list);
  return list;
}

export async function deleteFromPool(uuid: string): Promise<QuestionPoolItem[]> {
  const list = readRaw().filter((x) => x.uuid !== uuid);
  persistQuestionPool(list);
  return list;
}

export async function clearPool(_coachId?: string): Promise<void> {
  persistQuestionPool([]);
}

export function setPoolAnswer(uuid: string, answer: AnswerLetter | null) {
  return updateAnswer(uuid, answer);
}

export function bulkAddToPool(
  items: Omit<QuestionPoolItem, "uuid" | "savedAt">[]
): QuestionPoolItem[] {
  const stamped = items.map((item) => ({
    ...item,
    uuid: createPoolUuid(),
    savedAt: new Date().toISOString(),
  }));
  const list = readRaw();
  const next = [...stamped, ...list];
  persistQuestionPool(next);
  return next;
}
