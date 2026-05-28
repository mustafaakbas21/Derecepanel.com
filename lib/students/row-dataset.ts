import type { StudentRecord } from "@/lib/students/types";

/** Tablo satırı için data-* attribute map (camelCase → kebab HTML) */
export function studentRowDataAttributes(
  s: StudentRecord
): Record<string, string | undefined> {
  return {
    "data-student": "true",
    "data-ogrenci-id": s.ogrenciId,
    "data-name": s.name,
    "data-goal": s.goal,
    "data-alan": s.alan,
    "data-sinif-branch": s.sinifBranch,
    "data-status": s.status,
    "data-parent": s.parent,
    "data-parent-phone": s.parentPhone,
    "data-student-code": s.studentCode,
    "data-kayit-date": s.kayitDate,
    "data-email": s.email,
    "data-phone": s.phone,
    "data-tc-no": s.tcNo,
    "data-kullanici-adi": s.kullaniciAdi,
    "data-panel-sifre": s.panelSifre,
  };
}
