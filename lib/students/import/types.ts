import type { Gender, ParentRelation, StudentRecord, StudyField } from "@/lib/students/types";

export interface StudentImportRow {
  rowIndex: number;
  studentNo: string;
  firstName: string;
  lastName: string;
  tc: string;
  gender: Gender | "";
  birthDate: string;
  classRoom: string;
  branch: string;
  phone: string;
  parentName: string;
  parentPhone: string;
  parentRelation: string;
  package: string;
  target: string;
  displayName: string;
  /** Simple CSV */
  name?: string;
  sinif?: string;
  alan?: string;
  hedef?: string;
}

export interface StudentCreateInput {
  studentCode: string;
  tcNo?: string;
  name: string;
  gender?: Gender;
  birthDate?: string;
  phone?: string;
  sinifBranch: string;
  alan: StudyField;
  parent: string;
  parentPhone: string;
  parentRelation?: ParentRelation;
  kayitPaketi?: string;
  goal: string;
  targetUniversity?: string;
  targetDepartment?: string;
  status: "aktif";
  kayitDate: string;
}

export interface ImportApiRequest {
  students: StudentCreateInput[];
  existingStudentCodes: string[];
  coachId?: string;
}

export interface ImportApiResponse {
  success: boolean;
  imported: number;
  skipped: number;
  errors: { row: number; reason: string }[];
  records: StudentRecord[];
}

export interface ParseImportResult {
  students: StudentCreateInput[];
  errors: { row: number; reason: string }[];
  skipped: number;
}
