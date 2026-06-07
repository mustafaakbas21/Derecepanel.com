import type { AnalizData, AnalizExamOption, AnalizExamShell, AnalizStudent } from "@/lib/analiz/types";
import { getCurrentUser } from "@/lib/appointments/current-user";
import { findStudentRecordForUser } from "@/lib/konu-takip/student-scope";
import { studentExamResultIds } from "@/lib/student/exam-results-scope";

export function studentAnalizMatchIds(): string[] {
  const ids = new Set(studentExamResultIds());
  const user = getCurrentUser();
  if (user) {
    const record = findStudentRecordForUser(user);
    if (record?.ogrenciId) ids.add(record.ogrenciId);
    if (record?.studentCode) ids.add(record.studentCode);
  }
  return [...ids].filter(Boolean);
}

export function studentMatchesAnalizId(student: AnalizStudent, ids: string[]): boolean {
  if (!ids.length) return false;
  const set = new Set(ids.map((id) => String(id).trim()).filter(Boolean));
  const sid = String(student.id || "").trim();
  return sid ? set.has(sid) : false;
}

export function findStudentInExam(
  shell: AnalizExamShell | null | undefined,
  ids: string[] = studentAnalizMatchIds()
): AnalizStudent | null {
  if (!shell || !ids.length) return null;
  return shell.students.find((s) => studentMatchesAnalizId(s, ids)) ?? null;
}

export function filterExamListForStudent(
  data: AnalizData,
  ids: string[] = studentAnalizMatchIds()
): AnalizExamOption[] {
  if (!ids.length) return [];
  return data.examList.filter((exam) => {
    const shell = data.exams[exam.id];
    return shell ? findStudentInExam(shell, ids) != null : false;
  });
}

export function resolveStudentAnalizProfile(
  data: AnalizData,
  ids: string[] = studentAnalizMatchIds()
): AnalizStudent | null {
  for (const exam of filterExamListForStudent(data, ids)) {
    const shell = data.exams[exam.id];
    const found = findStudentInExam(shell, ids);
    if (found) return found;
  }
  return null;
}

export function resolveStudentDisplayName(data: AnalizData, fallback = "Öğrenci"): string {
  const user = getCurrentUser();
  if (user?.name) return user.name;
  return resolveStudentAnalizProfile(data)?.name ?? fallback;
}

export function pickDefaultExamId(
  exams: AnalizExamOption[],
  preferred?: string
): string {
  if (preferred && exams.some((e) => e.id === preferred)) return preferred;
  return exams[0]?.id ?? "";
}
