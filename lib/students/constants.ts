import type {
  Gender,
  ParentRelation,
  StudentFormState,
  StudentRecord,
  StudentStatus,
  StudyField,
} from "@/lib/students/types";

export const STORAGE_KEY = "students_full_v1";
export const CATALOG_KEY = "students_catalog_v1";
export const DEFAULT_COACH_ID = "coach-ayse-1";

export const FIELD_LABELS: Record<StudyField, string> = {
  tyt: "TYT",
  sayisal: "Sayısal",
  esit: "Eşit Ağırlık",
  sozel: "Sözel",
  dil: "Dil",
};

export const FIELD_BADGE: Record<StudyField, string> = {
  tyt: "bg-sky-50 text-sky-700 border-sky-200",
  sayisal: "bg-blue-50 text-blue-700 border-blue-200",
  esit: "bg-violet-50 text-violet-700 border-violet-200",
  sozel: "bg-orange-50 text-orange-700 border-orange-200",
  dil: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export const STATUS_LABELS: Record<StudentStatus, string> = {
  aktif: "Aktif",
  donduruldu: "Kayıt Donduruldu",
  mezun: "Mezun",
};

export const STATUS_STYLES: Record<StudentStatus, string> = {
  aktif: "bg-emerald-50 text-emerald-700 border-emerald-200",
  donduruldu: "bg-amber-50 text-amber-800 border-amber-200",
  mezun: "bg-violet-50 text-violet-700 border-violet-200",
};

export const ALAN_TABS: { id: StudyField | "tumu"; label: string }[] = [
  { id: "tumu", label: "Tümü" },
  { id: "tyt", label: "TYT" },
  { id: "sayisal", label: "Sayısal" },
  { id: "esit", label: "Eşit ağırlık" },
  { id: "sozel", label: "Sözel" },
  { id: "dil", label: "Dil" },
];

export const PAGE_SIZE_OPTIONS = [10, 18, 25] as const;
export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];
export const DEFAULT_PAGE_SIZE: PageSizeOption = 10;

export const SINIF_OPTIONS = [
  "9",
  "10",
  "11",
  "12",
  "12-A",
  "12-B",
  "12-C",
  "12-D",
  "12-F",
  "Mezun",
] as const;

export const GENDER_LABELS: Record<Gender, string> = {
  erkek: "Erkek",
  kadin: "Kadın",
  belirtmek_istemiyorum: "Belirtmek istemiyorum",
};

export const PARENT_RELATION_LABELS: Record<ParentRelation, string> = {
  anne: "Anne",
  baba: "Baba",
  vasi: "Vasi",
  diger: "Diğer",
};

export const KAYIT_PAKETI_OPTIONS = ["Standart", "Premium", "VIP", "Deneme"] as const;

export const PROGRAM_TYPE_OPTIONS = ["YKS", "TYT", "AYT", "Karma"] as const;

export function createOgrenciId() {
  return crypto.randomUUID?.() ?? `stu-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createStudentCode() {
  return `ÖĞ-${Date.now().toString(36).toUpperCase().slice(-8)}`;
}

export function buildGoal(university: string, department: string) {
  const u = university.trim();
  const d = department.trim();
  if (!u && !d) return "";
  if (!d) return u;
  if (!u) return d;
  return `${u} — ${d}`;
}

export function parseGoal(goal: string): { university: string; department: string } {
  const parts = goal.split("—").map((p) => p.trim());
  if (parts.length >= 2) {
    return { university: parts[0], department: parts.slice(1).join(" — ") };
  }
  return { university: goal.trim(), department: "" };
}

export function emptyStudentForm(): StudentFormState {
  return {
    name: "",
    studentCode: "",
    sinifBranch: "12",
    alan: "sayisal",
    goal: "",
    targetUniversity: "",
    targetDepartment: "",
    kayitDate: new Date().toISOString().slice(0, 10),
    status: "aktif",
    parent: "",
    parentPhone: "",
    bursPercent: 0,
  };
}

export function recordToForm(s: StudentRecord): StudentFormState {
  const { ogrenciId: _a, coachId: _b, ...rest } = s;
  return { ...rest };
}

export function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
