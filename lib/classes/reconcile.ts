import type { InstitutionClass } from "@/lib/classes/types";
import type { StudentRecord } from "@/lib/students/types";

function normKey(s: string): string {
  return s.trim().toLocaleLowerCase("tr").replace(/\s+/g, "");
}

/** Öğrenci kaydı bu kurumsal sınıfa ait mi? (institutionClassId veya sinifBranch) */
export function studentBelongsToClass(
  student: StudentRecord,
  cls: InstitutionClass
): boolean {
  if (student.institutionClassId && student.institutionClassId === cls.id) {
    return true;
  }
  const branch = (student.sinifBranch || "").trim();
  const name = cls.name.trim();
  if (!branch || !name) return false;
  const b = normKey(branch);
  const n = normKey(name);
  if (b === n) return true;
  if (n.startsWith(b) || b.startsWith(n)) return true;
  return false;
}

export function countStudentsInClass(
  cls: InstitutionClass,
  students: StudentRecord[]
): number {
  const ids = new Set(cls.studentIds);
  let n = ids.size;
  for (const s of students) {
    if (ids.has(s.ogrenciId)) continue;
    if (studentBelongsToClass(s, cls)) n++;
  }
  return n;
}

export function getClassMemberIds(
  cls: InstitutionClass,
  students: StudentRecord[]
): string[] {
  const out = new Set(cls.studentIds);
  for (const s of students) {
    if (studentBelongsToClass(s, cls)) out.add(s.ogrenciId);
  }
  return [...out];
}

/**
 * Sınıf studentIds[] ile öğrenci sinifBranch / institutionClassId alanlarını tek kaynakta birleştirir.
 */
export function reconcileClassesAndStudents(
  classes: InstitutionClass[],
  students: StudentRecord[]
): { classes: InstitutionClass[]; students: StudentRecord[]; changed: boolean } {
  const classById = new Map(classes.map((c) => [c.id, c]));
  const idsPerClass = new Map<string, Set<string>>();

  for (const c of classes) {
    idsPerClass.set(c.id, new Set(getClassMemberIds(c, students)));
  }

  const studentToClassId = new Map<string, string>();
  for (const c of classes) {
    for (const sid of idsPerClass.get(c.id) || []) {
      if (!studentToClassId.has(sid)) studentToClassId.set(sid, c.id);
    }
  }

  const nextClasses = classes.map((c) => {
    const ids = [...(idsPerClass.get(c.id) || [])].sort();
    const prev = [...c.studentIds].sort().join(",");
    const next = ids.join(",");
    return {
      ...c,
      studentIds: ids,
      updatedAt: prev !== next ? new Date().toISOString() : c.updatedAt,
    };
  });

  const nextStudents = students.map((s) => {
    const cid = studentToClassId.get(s.ogrenciId);
    if (cid) {
      const cls = classById.get(cid)!;
      if (s.institutionClassId === cid && s.sinifBranch === cls.name) return s;
      return { ...s, institutionClassId: cid, sinifBranch: cls.name };
    }
    if (s.institutionClassId) {
      return { ...s, institutionClassId: undefined };
    }
    return s;
  });

  const classesChanged = JSON.stringify(nextClasses) !== JSON.stringify(classes);
  const studentsChanged = JSON.stringify(nextStudents) !== JSON.stringify(students);

  return {
    classes: nextClasses,
    students: nextStudents,
    changed: classesChanged || studentsChanged,
  };
}

/** Modal kaydı sonrası öğrenci kayıtlarını sınıfa göre günceller */
export function applyClassRosterToStudents(
  students: StudentRecord[],
  cls: InstitutionClass
): StudentRecord[] {
  const memberSet = new Set(cls.studentIds);
  return students.map((s) => {
    if (memberSet.has(s.ogrenciId)) {
      return {
        ...s,
        institutionClassId: cls.id,
        sinifBranch: cls.name,
      };
    }
    if (s.institutionClassId === cls.id) {
      return { ...s, institutionClassId: undefined, sinifBranch: "" };
    }
    return s;
  });
}
