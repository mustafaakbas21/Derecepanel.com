import { catalogIdForUser } from "@/lib/appointments/catalog";
import { getCurrentUser } from "@/lib/appointments/current-user";
import { getCoachDisplayName, matchIdsForUser } from "@/lib/appointments/student-scope";
import type { CurrentUser } from "@/lib/appointments/types";
import { listStudentWeeklyInbox, type StudentWeeklyInboxItem } from "@/lib/weekly-planner/saved-programs";
import {
  findStudentPersonalForWeek,
  listStudentPersonalWeeklyPrograms,
  type StudentPersonalWeeklyProgram,
} from "@/lib/weekly-planner/student-personal-programs";
import { mondayOf, toISODate } from "@/lib/weekly-planner/week-utils";

export { getCoachDisplayName, getCurrentUser, matchIdsForUser };

export function listStudentWeeklyInboxForUser(
  user: CurrentUser | null
): StudentWeeklyInboxItem[] {
  if (!user) return [];
  const ids = matchIdsForUser(user, catalogIdForUser(user));
  const seen = new Set<string>();
  const items: StudentWeeklyInboxItem[] = [];

  for (const id of ids) {
    for (const item of listStudentWeeklyInbox(id)) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      items.push(item);
    }
  }

  return items.sort(
    (a, b) => new Date(b.weekMondayISO).getTime() - new Date(a.weekMondayISO).getTime()
  );
}

export function currentWeekMondayISO(now = new Date()): string {
  return toISODate(mondayOf(now));
}

export function getWeeklyProgramForWeek(
  user: CurrentUser | null,
  weekMondayISO: string
): StudentWeeklyInboxItem | null {
  return listStudentWeeklyInboxForUser(user).find((p) => p.weekMondayISO === weekMondayISO) ?? null;
}

export function getCurrentWeekProgram(user: CurrentUser | null): StudentWeeklyInboxItem | null {
  return getWeeklyProgramForWeek(user, currentWeekMondayISO());
}

export function listPastWeeklyPrograms(user: CurrentUser | null): StudentWeeklyInboxItem[] {
  const current = currentWeekMondayISO();
  return listStudentWeeklyInboxForUser(user).filter((p) => p.weekMondayISO < current);
}

export function listStudentPersonalProgramsForUser(
  user: CurrentUser | null
): StudentPersonalWeeklyProgram[] {
  if (!user) return [];
  const ids = matchIdsForUser(user, catalogIdForUser(user));
  const seen = new Set<string>();
  const items: StudentPersonalWeeklyProgram[] = [];

  for (const id of ids) {
    for (const item of listStudentPersonalWeeklyPrograms(id)) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      items.push(item);
    }
  }

  return items.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function getPersonalProgramForWeek(
  user: CurrentUser | null,
  weekMondayISO: string
): StudentPersonalWeeklyProgram | null {
  if (!user) return null;
  const ids = matchIdsForUser(user, catalogIdForUser(user));
  for (const id of ids) {
    const hit = findStudentPersonalForWeek(id, weekMondayISO);
    if (hit) return hit;
  }
  return null;
}

export function getCurrentWeekPersonalProgram(
  user: CurrentUser | null
): StudentPersonalWeeklyProgram | null {
  return getPersonalProgramForWeek(user, currentWeekMondayISO());
}
