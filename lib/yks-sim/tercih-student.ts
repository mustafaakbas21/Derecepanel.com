import type { StudentRecord } from "@/lib/students/types";
import type { YksSimUser } from "@/lib/yks-sim/types";
import { getCurrentUser } from "@/lib/yks-sim/student-sim-bridge";
import { loadStudentsFull } from "@/lib/students/storage";

import { panelGetItem, panelRemoveItem, panelSetItem } from "@/lib/panel-store";
export const TERCIH_SELECTED_STUDENT_LS = "derece_tercih_selected_student_v1";

export function studentToSimUser(s: StudentRecord): YksSimUser {
  return {
    id: s.ogrenciId,
    ogrenciId: s.ogrenciId,
    name: s.name,
    studentCode: s.studentCode,
    kullaniciAdi: s.kullaniciAdi,
    email: s.email,
    goal: s.goal,
  };
}

export function readSelectedTercihStudentId(): string {
  if (typeof window === "undefined") return "";
  return String(panelGetItem(TERCIH_SELECTED_STUDENT_LS) || "").trim();
}

export function saveSelectedTercihStudentId(ogrenciId: string) {
  if (typeof window === "undefined") return;
  const id = String(ogrenciId || "").trim();
  if (id) panelSetItem(TERCIH_SELECTED_STUDENT_LS, id);
  else panelRemoveItem(TERCIH_SELECTED_STUDENT_LS);
}

export function loadActiveStudentsForTercih(): StudentRecord[] {
  return loadStudentsFull({ seedIfEmpty: true })
    .filter((s) => s.status === "aktif")
    .sort((a, b) => a.name.localeCompare(b.name, "tr"));
}

/** Koç: Öğrencilerim kaydı; öğrenci portalı: currentUser */
export function resolveTercihSimUser(
  mode: "coach" | "student",
  selectedStudentId: string
): YksSimUser | null {
  if (mode === "student") {
    const u = getCurrentUser();
    if (u) return u;
  }
  const id = String(selectedStudentId || "").trim();
  if (!id) return null;
  const s = loadActiveStudentsForTercih().find((x) => x.ogrenciId === id);
  return s ? studentToSimUser(s) : null;
}
