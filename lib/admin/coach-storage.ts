import { panelGetItem, panelRemoveItem, panelSetItem } from "@/lib/panel-store";
import {
  BUILTIN_COACH,
  COACHES_STORAGE_KEY,
  ensureBuiltinCoachRoster,
  type LocalCoachAccount,
} from "@/lib/auth/local-auth";
import { loadStudentsFull } from "@/lib/students/storage";

function readJsonArray<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = panelGetItem(key);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeJsonArray<T>(key: string, arr: T[]) {
  if (typeof window === "undefined") return;
  panelSetItem(key, JSON.stringify(arr));
}

function normalizeCoach(raw: Record<string, unknown>): LocalCoachAccount | null {
  const username = String(raw.username || "").trim();
  const password = String(raw.password || "");
  if (!username || !password) return null;

  const coachId =
    String(raw.coachId || raw.id || "").trim() || `coach-${crypto.randomUUID()}`;

  return {
    id: String(raw.id || coachId).trim() || coachId,
    username,
    password,
    coachId,
    displayName: String(raw.displayName || raw.username || "").trim() || username,
    phone: String(raw.phone || "").trim() || undefined,
    specialty: String(raw.specialty || "").trim() || undefined,
    status: raw.status === "Pasif" ? "Pasif" : "Aktif",
    createdAt: String(raw.createdAt || "").trim() || undefined,
  };
}

function seedBuiltinCoachIfMissing() {
  const coaches = readJsonArray<Record<string, unknown>>(COACHES_STORAGE_KEY);
  const hasBuiltin = coaches.some(
    (c) => String(c.username || "").trim() === BUILTIN_COACH.username
  );
  if (hasBuiltin) return;

  coaches.push({
    id: BUILTIN_COACH.coachId,
    username: BUILTIN_COACH.username,
    password: BUILTIN_COACH.password,
    coachId: BUILTIN_COACH.coachId,
    displayName: BUILTIN_COACH.displayName,
    status: "Aktif",
  });
  writeJsonArray(COACHES_STORAGE_KEY, coaches);
}

export function loadCoaches(): LocalCoachAccount[] {
  ensureBuiltinCoachRoster();
  seedBuiltinCoachIfMissing();
  return readJsonArray<Record<string, unknown>>(COACHES_STORAGE_KEY)
    .map(normalizeCoach)
    .filter((c): c is LocalCoachAccount => c !== null);
}

export function findCoachById(coachId: string): LocalCoachAccount | null {
  return loadCoaches().find((c) => c.coachId === coachId || c.id === coachId) ?? null;
}

export function findCoachByUsername(username: string): LocalCoachAccount | null {
  const clue = username.trim();
  return loadCoaches().find((c) => c.username === clue) ?? null;
}

export function countStudentsByCoach(coachId: string): number {
  const students = loadStudentsFull({ seedIfEmpty: false });
  return students.filter((s) => s.coachId === coachId).length;
}

export type CoachDraft = {
  displayName: string;
  username: string;
  password: string;
  phone?: string;
  specialty?: string;
  status?: "Aktif" | "Pasif";
};

export function persistCoach(draft: CoachDraft, existingCoachId?: string): LocalCoachAccount {
  const coaches = loadCoaches();
  const username = draft.username.trim();
  const displayName = draft.displayName.trim() || username;

  const duplicate = coaches.find(
    (c) => c.username === username && c.coachId !== existingCoachId && c.id !== existingCoachId
  );
  if (duplicate) {
    throw new Error("Bu kullanıcı adı zaten kullanılıyor.");
  }

  if (existingCoachId) {
    const idx = coaches.findIndex(
      (c) => c.coachId === existingCoachId || c.id === existingCoachId
    );
    if (idx === -1) throw new Error("Koç bulunamadı.");

    const prev = coaches[idx]!;
    const updated: LocalCoachAccount = {
      ...prev,
      displayName,
      username,
      password: draft.password.trim() || prev.password,
      phone: draft.phone?.trim() || undefined,
      specialty: draft.specialty?.trim() || undefined,
      status: draft.status ?? prev.status ?? "Aktif",
    };
    coaches[idx] = updated;
    writeJsonArray(COACHES_STORAGE_KEY, coaches);
    return updated;
  }

  const coachId = `coach-${crypto.randomUUID()}`;
  const created: LocalCoachAccount = {
    id: coachId,
    coachId,
    username,
    password: draft.password,
    displayName,
    phone: draft.phone?.trim() || undefined,
    specialty: draft.specialty?.trim() || undefined,
    status: draft.status ?? "Aktif",
    createdAt: new Date().toISOString(),
  };

  if (username === BUILTIN_COACH.username) {
    throw new Error("Bu kullanıcı adı sistem tarafından ayrılmış.");
  }

  coaches.push(created);
  writeJsonArray(COACHES_STORAGE_KEY, coaches);
  return created;
}

export function deleteCoach(coachId: string): void {
  if (coachId === BUILTIN_COACH.coachId) {
    throw new Error("Varsayılan koç hesabı silinemez.");
  }
  const coaches = loadCoaches().filter(
    (c) => c.coachId !== coachId && c.id !== coachId
  );
  writeJsonArray(COACHES_STORAGE_KEY, coaches);
}

export function getCoachDisplayName(coachId: string): string {
  const coach = findCoachById(coachId);
  return coach?.displayName || coach?.username || coachId;
}
