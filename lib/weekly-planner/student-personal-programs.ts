import { panelGetItem, panelRemoveItem, panelSetItem } from "@/lib/panel-store";
import {
  STUDENT_PERSONAL_WEEKLY_CHANGE,
  STUDENT_PERSONAL_WEEKLY_KEY,
} from "@/lib/weekly-planner/constants";
import { newSavedProgramId } from "@/lib/weekly-planner/saved-programs";
import type { WeeklyTask } from "@/lib/weekly-planner/types";

export type StudentPersonalWeeklyProgram = {
  id: string;
  studentId: string;
  studentName: string;
  weekMondayISO: string;
  weekRangeLabel: string;
  tasks: WeeklyTask[];
  title: string;
  createdAt: string;
  updatedAt: string;
};

function readAll(): StudentPersonalWeeklyProgram[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = panelGetItem(STUDENT_PERSONAL_WEEKLY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StudentPersonalWeeklyProgram[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(list: StudentPersonalWeeklyProgram[]) {
  if (typeof window === "undefined") return;
  try {
    panelSetItem(STUDENT_PERSONAL_WEEKLY_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(STUDENT_PERSONAL_WEEKLY_CHANGE));
  } catch {
    /* quota */
  }
}

export { newSavedProgramId as newPersonalProgramId };

export function listStudentPersonalWeeklyPrograms(
  studentId?: string
): StudentPersonalWeeklyProgram[] {
  const list = readAll().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  if (!studentId) return list;
  return list.filter((p) => p.studentId === studentId);
}

export function getStudentPersonalWeeklyProgram(
  id: string
): StudentPersonalWeeklyProgram | null {
  return readAll().find((p) => p.id === id) ?? null;
}

export function findStudentPersonalForWeek(
  studentId: string,
  weekMondayISO: string
): StudentPersonalWeeklyProgram | null {
  return (
    readAll().find((p) => p.studentId === studentId && p.weekMondayISO === weekMondayISO) ??
    null
  );
}

export function upsertStudentPersonalWeeklyProgram(
  input: Omit<StudentPersonalWeeklyProgram, "createdAt" | "updatedAt"> & {
    createdAt?: string;
  }
): StudentPersonalWeeklyProgram {
  const all = readAll();
  const now = new Date().toISOString();
  const idx = all.findIndex((p) => p.id === input.id);
  const prev = idx >= 0 ? all[idx] : null;

  const next: StudentPersonalWeeklyProgram = {
    ...input,
    createdAt: input.createdAt ?? prev?.createdAt ?? now,
    updatedAt: now,
  };

  if (idx >= 0) all[idx] = next;
  else all.push(next);

  writeAll(all);
  return next;
}

export function deleteStudentPersonalWeeklyProgram(id: string): boolean {
  const all = readAll();
  const next = all.filter((p) => p.id !== id);
  if (next.length === all.length) return false;
  writeAll(next);
  return true;
}
