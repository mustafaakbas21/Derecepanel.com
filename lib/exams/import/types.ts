import type { ParseRow } from "@/lib/exams/types";

export type ImportCatalogStudent = {
  id: string;
  code: string;
  name: string;
  coachId?: string;
};

export type ExamResultImportRequest = {
  examId: string;
  examName: string;
  templateId: string;
  updateExisting: boolean;
  createMissingStudents: boolean;
  source: string;
  rows: ParseRow[];
  catalog?: ImportCatalogStudent[];
};

export type ExamResultImportResponse = {
  saved: number;
  skipped: number;
  errors: { rowId: string; message: string }[];
  createdStudents?: number;
};
