import type { WeeklyTask } from "@/lib/weekly-planner/types";
import { panelGetItem, panelRemoveItem, panelSetItem } from "@/lib/panel-store";
import {
  WEEKLY_PROGRAM_INBOX_CHANGE,
  WEEKLY_PROGRAM_INBOX_KEY,
  WEEKLY_PROGRAM_SAVED_CHANGE,
  WEEKLY_PROGRAM_SAVED_KEY,
} from "@/lib/weekly-planner/constants";

const SAVED_KEY = WEEKLY_PROGRAM_SAVED_KEY;
const INBOX_KEY = WEEKLY_PROGRAM_INBOX_KEY;

export type WeeklyProgramStatus = "kayitli" | "gonderildi";

export type SavedWeeklyProgram = {
  id: string;
  studentId: string;
  studentName: string;
  weekMondayISO: string;
  weekRangeLabel: string;
  tasks: WeeklyTask[];
  title: string;
  status: WeeklyProgramStatus;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
};

export type StudentWeeklyInboxItem = Pick<
  SavedWeeklyProgram,
  | "id"
  | "studentId"
  | "studentName"
  | "weekMondayISO"
  | "weekRangeLabel"
  | "tasks"
  | "title"
  | "updatedAt"
  | "sentAt"
>;

function readSaved(): SavedWeeklyProgram[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = panelGetItem(SAVED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedWeeklyProgram[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSaved(list: SavedWeeklyProgram[]) {
  if (typeof window === "undefined") return;
  try {
    panelSetItem(SAVED_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(WEEKLY_PROGRAM_SAVED_CHANGE));
  } catch {
    /* quota */
  }
}

function readInboxAll(): Record<string, StudentWeeklyInboxItem[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = panelGetItem(INBOX_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, StudentWeeklyInboxItem[]>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeInboxAll(data: Record<string, StudentWeeklyInboxItem[]>) {
  if (typeof window === "undefined") return;
  try {
    panelSetItem(INBOX_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent(WEEKLY_PROGRAM_INBOX_CHANGE));
  } catch {
    /* quota */
  }
}

export function newSavedProgramId(): string {
  return `wp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function listSavedWeeklyPrograms(): SavedWeeklyProgram[] {
  return readSaved().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function getSavedWeeklyProgram(id: string): SavedWeeklyProgram | null {
  return readSaved().find((p) => p.id === id) ?? null;
}

export function upsertSavedWeeklyProgram(
  input: Omit<SavedWeeklyProgram, "createdAt" | "updatedAt"> & { createdAt?: string }
): SavedWeeklyProgram {
  const all = readSaved();
  const now = new Date().toISOString();
  const idx = all.findIndex((p) => p.id === input.id);
  const prev = idx >= 0 ? all[idx] : null;

  const next: SavedWeeklyProgram = {
    ...input,
    createdAt: input.createdAt ?? prev?.createdAt ?? now,
    updatedAt: now,
    sentAt: input.sentAt ?? prev?.sentAt,
  };

  if (idx >= 0) all[idx] = next;
  else all.push(next);

  writeSaved(all);

  if (next.studentId && next.tasks.length > 0) {
    deliverWeeklyProgramToStudent(next);
  }

  return next;
}

export function deleteSavedWeeklyProgram(id: string): boolean {
  const all = readSaved();
  const next = all.filter((p) => p.id !== id);
  if (next.length === all.length) return false;
  writeSaved(next);
  return true;
}

export function findSavedForStudentWeek(
  studentId: string,
  weekMondayISO: string
): SavedWeeklyProgram | null {
  return (
    readSaved().find((p) => p.studentId === studentId && p.weekMondayISO === weekMondayISO) ??
    null
  );
}

/** Öğrenci paneli / ileride API için yerel kutu */
export function deliverWeeklyProgramToStudent(program: SavedWeeklyProgram): void {
  const all = readInboxAll();
  const list = all[program.studentId] ?? [];
  const item: StudentWeeklyInboxItem = {
    id: program.id,
    studentId: program.studentId,
    studentName: program.studentName,
    weekMondayISO: program.weekMondayISO,
    weekRangeLabel: program.weekRangeLabel,
    tasks: program.tasks,
    title: program.title,
    updatedAt: program.updatedAt,
    sentAt: new Date().toISOString(),
  };
  const withoutWeek = list.filter((x) => x.weekMondayISO !== program.weekMondayISO);
  all[program.studentId] = [item, ...withoutWeek];
  writeInboxAll(all);
}

export function listStudentWeeklyInbox(studentId: string): StudentWeeklyInboxItem[] {
  return readInboxAll()[studentId] ?? [];
}

export function buildWeeklyProgramWhatsappText(program: SavedWeeklyProgram): string {
  const lines = [
    `Merhaba ${program.studentName},`,
    "",
    `Haftalık çalışma programınız (${program.weekRangeLabel}):`,
    "",
  ];
  const byDay = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
  byDay.forEach((day, i) => {
    const dayTasks = program.tasks.filter((t) => t.dayIndex === i);
    if (!dayTasks.length) return;
    lines.push(`*${day}*`);
    for (const t of dayTasks) {
      lines.push(`• ${t.title}${t.meta ? ` (${t.meta})` : ""}`);
    }
    lines.push("");
  });
  lines.push("— DerecePanel koçunuz");
  return lines.join("\n");
}
