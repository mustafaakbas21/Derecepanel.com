import type { Appointment } from "@/lib/appointments/types";
import type { ExamResultPackage, ExamResultRow, MergedExam } from "@/lib/exams/types";
import type { StudentRecord } from "@/lib/students/types";

/** İstemci localStorage → API sync gövdesi (MVP; Supabase yokken) */
export type CoachBriefingSyncPayload = {
  appointments: Appointment[];
  students: StudentRecord[];
  examResults: ExamResultRow[];
  examPackages: ExamResultPackage[];
  mergedExams: MergedExam[];
};
