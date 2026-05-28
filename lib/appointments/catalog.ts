import type { CurrentUser } from "@/lib/appointments/types";
import { stableStudentIdFromRecord } from "@/lib/appointments/utils";
import { CATALOG_KEY } from "@/lib/students/constants";
import type { StudentRecord } from "@/lib/students/types";

export function catalogIdForUser(u: CurrentUser | null): string {
  if (!u || typeof window === "undefined") return "";
  try {
    const raw = localStorage.getItem(CATALOG_KEY);
    const list: StudentRecord[] = raw ? (JSON.parse(raw) as StudentRecord[]) : [];
    const uname = String(u.name || "").trim();
    const code = String(u.studentCode || u.code || "").trim();
    for (const c of list) {
      if (!c) continue;
      if (code && String(c.studentCode || "").trim() === code) {
        return stableStudentIdFromRecord(c);
      }
      if (uname && String(c.name || "").trim() === uname) {
        return stableStudentIdFromRecord(c);
      }
    }
  } catch {
    /* ignore */
  }
  return "";
}
