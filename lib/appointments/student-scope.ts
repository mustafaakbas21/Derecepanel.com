import { COACHES_STORAGE_KEY } from "@/lib/auth/local-auth";
import { coachProfile } from "@/lib/coach/dummy-data";
import { catalogIdForUser } from "@/lib/appointments/catalog";
import { getCurrentUser } from "@/lib/appointments/current-user";
import { loadAppointments } from "@/lib/appointments/storage";
import type { Appointment, CurrentUser } from "@/lib/appointments/types";
import { panelGetItem, panelRemoveItem, panelSetItem } from "@/lib/panel-store";
import {
  appointmentTs,
  applyStatusFilter,
  applyTypeFilter,
  belongsToStudent,
  normName,
  sortByTsAsc,
  studentMatchIds,
} from "@/lib/appointments/utils";
import type { StatusFilterKey, TypeFilterKey } from "@/lib/appointments/types";

export function matchIdsForUser(user: CurrentUser | null) {
  if (!user) return [];
  return studentMatchIds(user, catalogIdForUser(user));
}

export function filterAppointmentsForUser(
  all: Appointment[],
  user: CurrentUser | null
): Appointment[] {
  if (!user) return [];
  const matchIds = matchIdsForUser(user);
  const myName = normName(user.name ?? "");
  return all.filter((r) => belongsToStudent(r, matchIds, myName));
}

export function loadStudentAppointments(user: CurrentUser | null): Appointment[] {
  return filterAppointmentsForUser(loadAppointments(), user);
}

export function getCoachDisplayName(user: CurrentUser | null): string {
  const coachId = String(user?.coachId || "").trim();
  if (typeof window !== "undefined" && coachId) {
    try {
      const raw = panelGetItem(COACHES_STORAGE_KEY);
      const coaches = JSON.parse(raw || "[]") as Array<Record<string, unknown>>;
      if (Array.isArray(coaches)) {
        const hit = coaches.find((c) => {
          const id = String(c.id || c.coachId || "").trim();
          return id === coachId;
        });
        const name = String(hit?.displayName || hit?.username || "").trim();
        if (name) return name;
      }
    } catch {
      /* ignore */
    }
  }
  return coachProfile.name;
}

export function daysUntilAppointment(r: Appointment, now = new Date()): number | null {
  const ts = appointmentTs(r);
  if (Number.isNaN(ts)) return null;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const dayTs = new Date(ts);
  dayTs.setHours(0, 0, 0, 0);
  return Math.round((dayTs.getTime() - today.getTime()) / 86400000);
}

export function appointmentCountdownLabel(r: Appointment, now = new Date()): string {
  const d = daysUntilAppointment(r, now);
  if (d == null) return "";
  if (d < 0) return "Geçmiş";
  if (d === 0) return "Bugün";
  if (d === 1) return "Yarın";
  return `${d} gün sonra`;
}

export function filterStudentAppointments(
  list: Appointment[],
  status: StatusFilterKey,
  type: TypeFilterKey,
  now = new Date()
) {
  let out = applyStatusFilter(list, status, now);
  out = applyTypeFilter(out, type);
  return sortByTsAsc(out);
}

export function nextUpcomingAppointment(list: Appointment[], now = new Date()) {
  const upcoming = applyStatusFilter(list, "upcoming", now);
  return upcoming.length ? sortByTsAsc(upcoming)[0]! : null;
}
