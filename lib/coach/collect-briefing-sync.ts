"use client";

import { loadAppointments } from "@/lib/appointments/storage";
import type { CoachBriefingSyncPayload } from "@/lib/coach/coach-briefing-sync";
import { readCoachScopedExamResults, readExamPackages } from "@/lib/exams/exam-results-storage";
import { loadMergedExams } from "@/lib/exams/exam-storage";
import { loadStudentsFull } from "@/lib/students/storage";

/** Koç tarayıcısındaki güncel veriyi API'ye göndermek için toplar */
export function collectCoachBriefingSync(): CoachBriefingSyncPayload {
  return {
    appointments: loadAppointments(),
    students: loadStudentsFull({ seedIfEmpty: false }),
    examResults: readCoachScopedExamResults(),
    examPackages: readExamPackages(),
    mergedExams: loadMergedExams(),
  };
}
