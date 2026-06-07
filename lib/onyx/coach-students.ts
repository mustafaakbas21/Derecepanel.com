import { getActiveCoachId, shouldFilterByCoach } from "@/lib/exams/coach-scope";
import type { StudentRecord } from "@/lib/students/types";

/** Koç paneli — aktif öğrenciler (oturumdaki koça göre filtrelenir) */
export function filterCoachActiveStudents(
  students: StudentRecord[]
): StudentRecord[] {
  const active = students.filter((s) => s.status === "aktif");
  if (!shouldFilterByCoach()) return active;
  const coachId = getActiveCoachId();
  if (!coachId) return active;
  return active.filter((s) => String(s.coachId || "").trim() === coachId);
}

export function studentSelectValue(student: StudentRecord): string {
  return String(student.ogrenciId || student.studentCode || "").trim();
}

export function studentDisplayName(student: StudentRecord): string {
  return student.name?.trim() || student.studentCode || student.ogrenciId;
}
