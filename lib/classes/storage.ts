import { CLASSES_STORAGE_KEY } from "@/lib/classes/constants";
import { dispatchClassesChange } from "@/lib/classes/events";
import type { ClassDraft, InstitutionClass } from "@/lib/classes/types";
import { DEFAULT_COACH_ID } from "@/lib/students/constants";
import { normalizeStudyField } from "@/lib/students/normalize-field";

import { panelGetItem, panelRemoveItem, panelSetItem } from "@/lib/panel-store";
const SEED: InstitutionClass[] = [
  {
    id: "cls-seed-12a",
    name: "12-A",
    field: "sayisal",
    studentIds: [],
    coachId: DEFAULT_COACH_ID,
    createdAt: "2026-01-15T10:00:00.000Z",
    updatedAt: "2026-01-15T10:00:00.000Z",
  },
  {
    id: "cls-seed-mezun-ea",
    name: "Mezun-EA",
    field: "esit",
    studentIds: [],
    coachId: DEFAULT_COACH_ID,
    createdAt: "2026-02-01T10:00:00.000Z",
    updatedAt: "2026-02-01T10:00:00.000Z",
  },
];

function parseClasses(raw: string | null): InstitutionClass[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as InstitutionClass[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((c) => c?.id && c?.name)
      .map((c) => ({
        ...c,
        field: normalizeStudyField(c.field),
        studentIds: Array.isArray(c.studentIds)
          ? c.studentIds.map(String).filter(Boolean)
          : [],
      }));
  } catch {
    return [];
  }
}

export function loadInstitutionClasses(): InstitutionClass[] {
  if (typeof window === "undefined") return SEED;
  const raw = panelGetItem(CLASSES_STORAGE_KEY);
  if (raw === null) {
    persistInstitutionClasses(SEED, { silent: true });
    return SEED;
  }
  return parseClasses(raw);
}

export function persistInstitutionClasses(
  list: InstitutionClass[],
  options?: { silent?: boolean }
) {
  if (typeof window === "undefined") return;
  panelSetItem(CLASSES_STORAGE_KEY, JSON.stringify(list));
  if (!options?.silent) dispatchClassesChange();
}

export function createClassId(): string {
  return `cls-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function upsertInstitutionClass(draft: ClassDraft): InstitutionClass {
  const list = loadInstitutionClasses();
  const now = new Date().toISOString();
  const normalizedIds = [...new Set(draft.studentIds.map(String).filter(Boolean))];

  const id = draft.id || createClassId();
  const base = list.find((c) => c.id === id);

  const row: InstitutionClass = {
    id,
    name: draft.name.trim() || "Adsız sınıf",
    field: draft.field,
    studentIds: normalizedIds,
    coachId: base?.coachId || DEFAULT_COACH_ID,
    createdAt: base?.createdAt || now,
    updatedAt: now,
  };

  let next = removeStudentFromOtherClasses(list, id, normalizedIds);
  const idx = next.findIndex((c) => c.id === id);
  if (idx >= 0) next[idx] = row;
  else next = [row, ...next];

  persistInstitutionClasses(next);
  return row;
}

/** Öğrenci yalnızca bir sınıfta — diğer sınıflardan çıkar */
function removeStudentFromOtherClasses(
  list: InstitutionClass[],
  keepClassId: string,
  studentIds: string[]
): InstitutionClass[] {
  const idSet = new Set(studentIds);
  return list.map((c) => {
    if (c.id === keepClassId) return c;
    const next = c.studentIds.filter((sid) => !idSet.has(sid));
    if (next.length === c.studentIds.length) return c;
    return { ...c, studentIds: next, updatedAt: new Date().toISOString() };
  });
}

export function deleteInstitutionClass(id: string) {
  const list = loadInstitutionClasses().filter((c) => c.id !== id);
  persistInstitutionClasses(list);
}

export function findClassById(id: string): InstitutionClass | undefined {
  return loadInstitutionClasses().find((c) => c.id === id);
}

export function allAssignedStudentIds(classes: InstitutionClass[]): Set<string> {
  const set = new Set<string>();
  classes.forEach((c) => c.studentIds.forEach((id) => set.add(id)));
  return set;
}
