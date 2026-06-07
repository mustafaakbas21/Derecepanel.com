import { writeJson } from "@/lib/exams/storage/local-storage";

import { KONU_TAKIP_CHANGED_EVENT, KONU_TAKIP_KEY } from "@/lib/konu-takip/constants";
import { panelGetItem, panelRemoveItem, panelSetItem } from "@/lib/panel-store";
import type {
  KonuTakipStore,
  StudentTracking,
  TopicProgress,
  TopicStatus,
} from "@/lib/konu-takip/types";

export function topicKey(subjectId: string, topicId: string): string {
  return `${subjectId}::${topicId}`;
}

function emptyProgress(): TopicProgress {
  return {
    status: "baslanmadi",
    solved: 0,
    bookIds: [],
    updatedAt: new Date().toISOString(),
  };
}

export function loadStore(): KonuTakipStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = panelGetItem(KONU_TAKIP_KEY);
    if (!raw) return {};
    const obj = JSON.parse(raw) as unknown;
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return {};
    return obj as KonuTakipStore;
  } catch {
    return {};
  }
}

function dispatchChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(KONU_TAKIP_CHANGED_EVENT));
}

export function saveStore(store: KonuTakipStore) {
  writeJson(KONU_TAKIP_KEY, store);
  dispatchChanged();
}

export function loadStudentTracking(studentId: string): StudentTracking {
  return loadStore()[studentId] ?? {};
}

export function getProgress(
  studentId: string,
  subjectId: string,
  topicId: string
): TopicProgress {
  return loadStudentTracking(studentId)[topicKey(subjectId, topicId)] ?? emptyProgress();
}

function mutate(
  studentId: string,
  subjectId: string,
  topicId: string,
  fn: (current: TopicProgress) => TopicProgress
) {
  if (!studentId) return;
  const store = loadStore();
  const key = topicKey(subjectId, topicId);
  const tracking = store[studentId] ?? {};
  const current = tracking[key] ?? emptyProgress();
  const next = fn(current);
  next.updatedAt = new Date().toISOString();
  store[studentId] = { ...tracking, [key]: next };
  saveStore(store);
}

export function setStatus(
  studentId: string,
  subjectId: string,
  topicId: string,
  status: TopicStatus
) {
  mutate(studentId, subjectId, topicId, (cur) => ({ ...cur, status }));
}

export function setSolved(
  studentId: string,
  subjectId: string,
  topicId: string,
  solved: number
) {
  const safe = Math.max(0, Math.round(Number.isFinite(solved) ? solved : 0));
  mutate(studentId, subjectId, topicId, (cur) => ({ ...cur, solved: safe }));
}

export function addSolved(
  studentId: string,
  subjectId: string,
  topicId: string,
  delta: number
) {
  mutate(studentId, subjectId, topicId, (cur) => ({
    ...cur,
    solved: Math.max(0, cur.solved + Math.round(delta)),
  }));
}

export function setBooks(
  studentId: string,
  subjectId: string,
  topicId: string,
  bookIds: string[]
) {
  const unique = Array.from(new Set(bookIds.filter(Boolean)));
  mutate(studentId, subjectId, topicId, (cur) => ({ ...cur, bookIds: unique }));
}

export function setTarget(
  studentId: string,
  subjectId: string,
  topicId: string,
  target: number
) {
  const safe = Math.max(0, Math.round(Number.isFinite(target) ? target : 0));
  mutate(studentId, subjectId, topicId, (cur) => ({
    ...cur,
    target: safe > 0 ? safe : undefined,
  }));
}

export function setNote(
  studentId: string,
  subjectId: string,
  topicId: string,
  note: string
) {
  const trimmed = note.trim();
  mutate(studentId, subjectId, topicId, (cur) => ({
    ...cur,
    note: trimmed || undefined,
  }));
}

/** Bir dersin verilen konularını topluca tek durumda işaretler (tek kayıt/olay). */
export function setDersStatus(
  studentId: string,
  subjectId: string,
  topicIds: string[],
  status: TopicStatus
) {
  if (!studentId || topicIds.length === 0) return;
  const store = loadStore();
  const tracking = store[studentId] ?? {};
  const now = new Date().toISOString();
  const next: StudentTracking = { ...tracking };
  for (const topicId of topicIds) {
    const key = topicKey(subjectId, topicId);
    const cur = next[key] ?? emptyProgress();
    next[key] = { ...cur, status, updatedAt: now };
  }
  store[studentId] = next;
  saveStore(store);
}
