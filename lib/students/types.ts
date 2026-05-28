export type StudyField = "tyt" | "sayisal" | "esit" | "sozel" | "dil";

export type StudentStatus = "aktif" | "donduruldu" | "mezun";

export type Gender = "erkek" | "kadin" | "belirtmek_istemiyorum";

export type ParentRelation = "anne" | "baba" | "vasi" | "diger";

export interface StudentRecord {
  ogrenciId: string;
  coachId: string;
  tcNo?: string;
  name: string;
  gender?: Gender;
  birthDate?: string;
  email?: string;
  phone?: string;
  city?: string;
  ilce?: string;
  studentCode: string;
  sinifBranch: string;
  alan: StudyField;
  counselorName?: string;
  kayitPaketi?: string;
  programType?: string;
  targetUniversity?: string;
  targetDepartment?: string;
  goal: string;
  bursPercent?: number;
  kayitDate: string;
  address?: string;
  notes?: string;
  counselorNote?: string;
  status: StudentStatus;
  parent: string;
  parentRelation?: ParentRelation;
  parentPhone: string;
  parentEmail?: string;
  emergencyNotes?: string;
  kullaniciAdi?: string;
  panelSifre?: string;
}

export type StudentFormState = Omit<StudentRecord, "ogrenciId" | "coachId"> & {
  ogrenciId?: string;
  coachId?: string;
};

export type AlanFilterId = "tumu" | StudyField;

export type StatusFilterId = "tumu" | StudentStatus;
