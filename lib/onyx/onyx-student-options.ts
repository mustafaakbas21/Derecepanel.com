import type { StudentRecord } from "@/lib/students/types";

/** Onyx UI — sunucudan istemciye güvenle aktarılabilir öğrenci özeti */
export type OnyxStudentOption = {
  id: string;
  name: string;
  studentCode: string;
  coachId: string;
  status: StudentRecord["status"];
  alan?: StudentRecord["alan"];
  goal?: string;
  targetUniversity?: string;
  targetDepartment?: string;
};

export function toOnyxStudentOption(student: StudentRecord): OnyxStudentOption {
  return {
    id: String(student.ogrenciId || student.studentCode || "").trim(),
    name: student.name?.trim() || "—",
    studentCode: student.studentCode || "",
    coachId: student.coachId || "",
    status: student.status,
    alan: student.alan,
    goal: student.goal,
    targetUniversity: student.targetUniversity,
    targetDepartment: student.targetDepartment,
  };
}

/** Sunucu (RSC) — localStorage yok; istemci hydrate ile dolar */
export function getServerOnyxStudentOptions(): OnyxStudentOption[] {
  return [];
}

export function onyxOptionToStudentRecord(option: OnyxStudentOption): StudentRecord {
  return {
    ogrenciId: option.id,
    coachId: option.coachId,
    name: option.name,
    studentCode: option.studentCode,
    sinifBranch: "",
    alan: option.alan ?? "tyt",
    goal: option.goal ?? "",
    targetUniversity: option.targetUniversity,
    targetDepartment: option.targetDepartment,
    kayitDate: "",
    status: option.status,
    parent: "",
    parentPhone: "",
  };
}
