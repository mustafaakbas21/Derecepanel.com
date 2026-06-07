import { getCachedAuthSession } from "@/lib/auth/local-auth";
import { DEFAULT_COACH_ID } from "@/lib/students/constants";
import { loadStudentsFull } from "@/lib/students/storage";
import type { ExamResultRow } from "@/lib/exams/types";

export function getActiveCoachId(): string {
  if (typeof window === "undefined") return DEFAULT_COACH_ID;
  const session = getCachedAuthSession();
  if (!session) return DEFAULT_COACH_ID;
  if (session.role !== "coach" && session.role !== "admin") return "";
  return session.userId.trim() || DEFAULT_COACH_ID;
}

export function shouldFilterByCoach(): boolean {
  if (typeof window === "undefined") return false;
  return getCachedAuthSession()?.role === "coach";
}

/** Koçun öğrencileri — ogrenciId + studentCode (ESKİ allow-list) */
export function buildCoachStudentAllowSet(
  catalog: { id: string; coachId?: string; code?: string }[]
): Set<string> | null {
  if (!shouldFilterByCoach()) return null;
  const cid = getActiveCoachId();
  if (!cid) return new Set();

  const allow = new Set<string>();

  const add = (id?: string, code?: string) => {
    const sid = String(id || "").trim();
    const scode = String(code || "").trim();
    if (sid) allow.add(sid);
    if (scode) allow.add(scode);
  };

  catalog.forEach((s) => {
    if (String(s.coachId || "").trim() === cid) add(s.id, s.code);
  });

  loadStudentsFull({ seedIfEmpty: false }).forEach((st) => {
    if (String(st.coachId || "").trim() === cid) {
      add(st.ogrenciId, st.studentCode);
    }
  });

  return allow;
}

/** @deprecated buildCoachStudentAllowSet kullanın */
export function coachScopedStudentIdSet(
  catalogIds: { id: string; coachId?: string; code?: string }[]
): Set<string> | null {
  return buildCoachStudentAllowSet(catalogIds);
}

export function rowMatchesCoachAllow(row: ExamResultRow, allow: Set<string>): boolean {
  const sid = String(row.studentId || "").trim();
  const scode = String(row.studentCode || "").trim();
  if (sid && allow.has(sid)) return true;
  if (scode && allow.has(scode)) return true;
  return false;
}
