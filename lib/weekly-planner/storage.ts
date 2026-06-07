import type { WeeklyPlannerDraft, WeeklyTask } from "@/lib/weekly-planner/types";

import { panelGetItem, panelRemoveItem, panelSetItem } from "@/lib/panel-store";
const DRAFT_KEY = "derecepanel_weekly_planner_draft_v1";

function readAll(): Record<string, WeeklyPlannerDraft> {
  if (typeof window === "undefined") return {};
  try {
    const raw = panelGetItem(DRAFT_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, WeeklyPlannerDraft>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, WeeklyPlannerDraft>) {
  if (typeof window === "undefined") return;
  try {
    panelSetItem(DRAFT_KEY, JSON.stringify(data));
  } catch {
    /* quota */
  }
}

export function draftKey(studentId: string, weekMondayISO: string): string {
  return `${studentId}:${weekMondayISO}`;
}

export function loadWeeklyDraft(
  studentId: string,
  weekMondayISO: string
): WeeklyPlannerDraft | null {
  if (!studentId) return null;
  const all = readAll();
  return all[draftKey(studentId, weekMondayISO)] ?? null;
}

export function saveWeeklyDraft(
  studentId: string,
  weekMondayISO: string,
  tasks: WeeklyTask[]
): WeeklyPlannerDraft {
  const all = readAll();
  const key = draftKey(studentId, weekMondayISO);
  const next: WeeklyPlannerDraft = {
    studentId,
    weekMondayISO,
    tasks,
    updatedAt: new Date().toISOString(),
  };
  all[key] = next;
  writeAll(all);
  return next;
}

export function clearWeeklyDraft(studentId: string, weekMondayISO: string): void {
  if (!studentId) return;
  const all = readAll();
  delete all[draftKey(studentId, weekMondayISO)];
  writeAll(all);
}

export function newTaskId(): string {
  return `wt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
