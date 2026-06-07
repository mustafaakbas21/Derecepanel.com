import type { StudyField } from "@/lib/students/types";

/** Öğrencilerim ile aynı YKS alan/puan türü */
export type ClassField = StudyField;

export type InstitutionClass = {
  id: string;
  name: string;
  field: ClassField;
  studentIds: string[];
  coachId?: string;
  createdAt: string;
  updatedAt: string;
};

export type ClassDraft = {
  id: string | null;
  name: string;
  field: ClassField;
  studentIds: string[];
};
