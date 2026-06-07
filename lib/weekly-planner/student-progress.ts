import { panelGetItem, panelRemoveItem, panelSetItem } from "@/lib/panel-store";
import {
  WEEKLY_PROGRAM_PROGRESS_CHANGE,
  WEEKLY_PROGRAM_PROGRESS_KEY,
} from "@/lib/weekly-planner/constants";
import type { WeeklyTask } from "@/lib/weekly-planner/types";

export type ProgramProgressRecord = {
  programId: string;
  completedTaskIds: string[];
  updatedAt: string;
};

function readAll(): Record<string, ProgramProgressRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = panelGetItem(WEEKLY_PROGRAM_PROGRESS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, ProgramProgressRecord>) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, ProgramProgressRecord>) {
  if (typeof window === "undefined") return;
  try {
    panelSetItem(WEEKLY_PROGRAM_PROGRESS_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent(WEEKLY_PROGRAM_PROGRESS_CHANGE));
  } catch {
    /* quota */
  }
}

function progressKey(studentScopeKey: string, programId: string) {
  return `${studentScopeKey}:${programId}`;
}

export function getProgramProgress(
  studentScopeKey: string,
  programId: string
): ProgramProgressRecord {
  const hit = readAll()[progressKey(studentScopeKey, programId)];
  return (
    hit ?? {
      programId,
      completedTaskIds: [],
      updatedAt: new Date().toISOString(),
    }
  );
}

export function isTaskCompleted(
  studentScopeKey: string,
  programId: string,
  taskId: string
): boolean {
  return getProgramProgress(studentScopeKey, programId).completedTaskIds.includes(taskId);
}

export function toggleTaskCompleted(
  studentScopeKey: string,
  programId: string,
  taskId: string
): boolean {
  const key = progressKey(studentScopeKey, programId);
  const all = readAll();
  const prev = all[key] ?? { programId, completedTaskIds: [], updatedAt: "" };
  const set = new Set(prev.completedTaskIds);
  if (set.has(taskId)) set.delete(taskId);
  else set.add(taskId);
  all[key] = {
    programId,
    completedTaskIds: [...set],
    updatedAt: new Date().toISOString(),
  };
  writeAll(all);
  return set.has(taskId);
}

export function computeProgramCompletion(
  tasks: WeeklyTask[],
  completedTaskIds: string[]
): { total: number; done: number; ratio: number; studyTotal: number; studyDone: number } {
  const studyTasks = tasks.filter((t) => t.taskKind !== "etut_mola");
  const doneSet = new Set(completedTaskIds);
  const total = studyTasks.length;
  const done = studyTasks.filter((t) => doneSet.has(t.id)).length;
  const studyTotal = total;
  const studyDone = done;
  return {
    total: tasks.length,
    done: tasks.filter((t) => doneSet.has(t.id)).length,
    ratio: studyTotal > 0 ? studyDone / studyTotal : 0,
    studyTotal,
    studyDone,
  };
}
