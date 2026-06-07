import { catalogIdForUser } from "@/lib/appointments/catalog";
import { getCurrentUser } from "@/lib/appointments/current-user";
import { getCoachDisplayName, matchIdsForUser } from "@/lib/appointments/student-scope";
import type { CurrentUser } from "@/lib/appointments/types";
import { stableStudentIdFromRecord } from "@/lib/appointments/utils";
import { CATALOG_KEY } from "@/lib/students/constants";
import type { StudentRecord } from "@/lib/students/types";

import { panelGetItem, panelRemoveItem, panelSetItem } from "@/lib/panel-store";
export { getCoachDisplayName, getCurrentUser };

export function findStudentRecordForUser(user: CurrentUser | null): StudentRecord | null {
  if (!user || typeof window === "undefined") return null;
  try {
    const raw = panelGetItem(CATALOG_KEY);
    const list: StudentRecord[] = raw ? (JSON.parse(raw) as StudentRecord[]) : [];
    if (!Array.isArray(list)) return null;

    const catalogId = catalogIdForUser(user);
    const matchIds = new Set(matchIdsForUser(user, catalogId));

    for (const record of list) {
      if (!record) continue;
      const id = stableStudentIdFromRecord(record);
      if (matchIds.has(id) || matchIds.has(record.ogrenciId)) return record;
      if (user.ogrenciId && record.ogrenciId === user.ogrenciId) return record;
      if (user.studentCode && record.studentCode === user.studentCode) return record;
      if (user.name && record.name.trim() === user.name.trim()) return record;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** Konu takip store anahtarı — koç paneliyle aynı ogrenciId */
export function resolveStudentTrackingId(user: CurrentUser | null): string {
  const record = findStudentRecordForUser(user);
  if (record?.ogrenciId) return record.ogrenciId;
  if (!user) return "";
  const catalogId = catalogIdForUser(user);
  if (catalogId) return catalogId;
  return user.ogrenciId ?? user.id ?? user.studentCode ?? "";
}
