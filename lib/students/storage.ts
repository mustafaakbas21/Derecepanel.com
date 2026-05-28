import {
  CATALOG_KEY,
  DEFAULT_COACH_ID,
  STORAGE_KEY,
  createOgrenciId,
  createStudentCode,
  parseGoal,
} from "@/lib/students/constants";
import { dispatchStudentsChange } from "@/lib/students/events";
import {
  normalizeStudentStatus,
  normalizeStudyField,
} from "@/lib/students/normalize-field";
import { SEED_STUDENTS } from "@/lib/students/seed";
import type { StudentRecord, StudyField, StudentStatus } from "@/lib/students/types";

/** ESKİ Derecepanel tam liste anahtarı */
export const LEGACY_STUDENTS_FULL_KEY = "derecepanel_students_full_v1";

type LegacyStudent = {
  id: string;
  fullName: string;
  universityGoal: string;
  parentName: string;
  parentPhone: string;
  field: string;
  classGrade: string;
  status: string;
  email?: string;
};

function legacyToRecord(l: LegacyStudent): StudentRecord {
  const { university, department } = parseGoal(l.universityGoal.replace(/—/g, "—"));
  return {
    ogrenciId: l.id || createOgrenciId(),
    coachId: DEFAULT_COACH_ID,
    name: l.fullName,
    studentCode: createStudentCode(),
    sinifBranch: l.classGrade,
    alan: normalizeStudyField(l.field),
    goal: l.universityGoal,
    targetUniversity: university,
    targetDepartment: department,
    kayitDate: new Date().toISOString().slice(0, 10),
    status: normalizeStudentStatus(l.status),
    parent: l.parentName,
    parentPhone: l.parentPhone,
    email: l.email,
  };
}

function normalizeRecord(raw: StudentRecord): StudentRecord {
  return {
    ...raw,
    alan: normalizeStudyField(raw.alan),
    status: normalizeStudentStatus(raw.status),
  };
}

/** Eski kayıtlarda "Sözel" gibi etiketler varsa diske doğru anahtarla yazar */
function repairStoredStudentsIfNeeded(normalized: StudentRecord[]) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as StudentRecord[];
    if (!Array.isArray(parsed)) return;
    const needsWrite = parsed.some((row, i) => {
      const n = normalized[i];
      return !n || row.alan !== n.alan || row.status !== n.status;
    });
    if (needsWrite) persistStudentsFull(normalized, { silent: true });
  } catch {
    /* ignore */
  }
}

function parseStudentArray(raw: string | null): StudentRecord[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as StudentRecord[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [];
    return parsed.map(normalizeRecord);
  } catch {
    return [];
  }
}

export type LoadStudentsOptions = {
  /** İlk kurulumda demo seed yaz (öğrenciler sayfası). Dashboard için false. */
  seedIfEmpty?: boolean;
};

export function loadStudentsFull(options: LoadStudentsOptions = {}): StudentRecord[] {
  const { seedIfEmpty = true } = options;
  if (typeof window === "undefined") return seedIfEmpty ? SEED_STUDENTS : [];

  try {
    const primary = parseStudentArray(localStorage.getItem(STORAGE_KEY));
    if (primary.length > 0) {
      repairStoredStudentsIfNeeded(primary);
      return primary;
    }

    const legacyFull = parseStudentArray(localStorage.getItem(LEGACY_STUDENTS_FULL_KEY));
    if (legacyFull.length > 0) {
      persistStudentsFull(legacyFull, { silent: true });
      return legacyFull;
    }

    const legacy = localStorage.getItem("students_v0");
    if (legacy) {
      const arr = JSON.parse(legacy) as LegacyStudent[];
      if (Array.isArray(arr) && arr.length > 0) {
        const migrated = arr.map(legacyToRecord);
        persistStudentsFull(migrated, { silent: true });
        return migrated;
      }
    }
  } catch {
    /* ignore */
  }

  if (!seedIfEmpty) return [];

  persistStudentsFull(SEED_STUDENTS, { silent: true });
  return SEED_STUDENTS;
}

export function persistStudentsFull(
  list: StudentRecord[],
  options?: { silent?: boolean }
) {
  if (typeof window === "undefined") return;
  const normalized = list.map(normalizeRecord);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  const catalog = normalized.map((s) => ({
    ogrenciId: s.ogrenciId,
    name: s.name,
    studentCode: s.studentCode,
    goal: s.goal,
    alan: s.alan,
    status: s.status,
  }));
  localStorage.setItem(CATALOG_KEY, JSON.stringify(catalog));
  if (!options?.silent) dispatchStudentsChange();
}

export function findStudentById(
  list: StudentRecord[],
  ogrenciId: string
): StudentRecord | undefined {
  return list.find((s) => s.ogrenciId === ogrenciId);
}

export function formatKayitDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
