import type { StudyField, StudentStatus } from "@/lib/students/types";

const STUDY_FIELDS: StudyField[] = ["tyt", "sayisal", "esit", "sozel", "dil"];

/** Öğrencilerim + içe aktarma ile aynı alan eşlemesi */
export function normalizeStudyField(raw: unknown): StudyField {
  const s = String(raw ?? "")
    .trim()
    .toLocaleLowerCase("tr-TR");

  if (STUDY_FIELDS.includes(s as StudyField)) return s as StudyField;

  if (s.includes("say")) return "sayisal";
  if (s.includes("eşit") || s.includes("esit") || s.includes("ea")) return "esit";
  if (s.includes("söz") || s.includes("sozel")) return "sozel";
  if (s.includes("dil")) return "dil";
  if (s.includes("tyt")) return "tyt";

  return "sayisal";
}

export function normalizeStudentStatus(raw: unknown): StudentStatus {
  const s = String(raw ?? "")
    .trim()
    .toLocaleLowerCase("tr-TR");

  if (s === "mezun") return "mezun";
  if (s === "donduruldu") return "donduruldu";
  if (s === "aktif") return "aktif";
  if (s === "pasif" || s === "beklemede") return "donduruldu";
  return "aktif";
}
