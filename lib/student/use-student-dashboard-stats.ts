"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { summarizeStudent } from "@/lib/konu-takip/aggregate";
import { useStudentKonuTakip } from "@/hooks/use-student-konu-takip";
import { onExamResultsChange, onExamsChange } from "@/lib/exams/events";
import { loadUpcomingExams } from "@/lib/exams/storage/exam-storage";
import {
  latestStudentExamSnapshot,
  studentExamResultIds,
} from "@/lib/student/exam-results-scope";
import { useStudentPersonalWeeklyProgram } from "@/lib/weekly-planner/use-student-personal-weekly-program";
import { useStudentWeeklyProgram } from "@/lib/weekly-planner/use-student-weekly-program";

export function useStudentDashboardStats() {
  const coachProgram = useStudentWeeklyProgram();
  const personalProgram = useStudentPersonalWeeklyProgram();
  const konuTakip = useStudentKonuTakip();

  const [examTick, setExamTick] = useState(0);
  const [upcomingExamCount, setUpcomingExamCount] = useState(0);
  const [examsHydrated, setExamsHydrated] = useState(false);

  const studentIds = useMemo(() => studentExamResultIds(), []);

  const refreshExams = useCallback(() => {
    setExamTick((n) => n + 1);
    setUpcomingExamCount(loadUpcomingExams(50).length);
    setExamsHydrated(true);
  }, []);

  useEffect(() => {
    refreshExams();
    const offResults = onExamResultsChange(refreshExams);
    const offCalendar = onExamsChange(refreshExams);
    return () => {
      offResults();
      offCalendar();
    };
  }, [refreshExams]);

  const lastExam = useMemo(() => {
    void examTick;
    return latestStudentExamSnapshot(studentIds);
  }, [examTick, studentIds]);

  const examHydrated = examsHydrated;

  const homework = useMemo(() => {
    if (coachProgram.program) {
      return {
        done: coachProgram.progress.studyDone,
        total: coachProgram.progress.studyTotal,
        source: "coach" as const,
      };
    }
    if (personalProgram.program) {
      return {
        done: personalProgram.progress.studyDone,
        total: personalProgram.progress.studyTotal,
        source: "personal" as const,
      };
    }
    return { done: 0, total: 0, source: null };
  }, [coachProgram.program, coachProgram.progress, personalProgram.program, personalProgram.progress]);

  const homeworkHydrated = coachProgram.hydrated && personalProgram.hydrated;

  const topicSummary = useMemo(
    () => summarizeStudent(konuTakip.tracking, "ALL"),
    [konuTakip.tracking]
  );

  const topicPercent = Number.isFinite(topicSummary.ratio)
    ? Math.round(topicSummary.ratio * 100)
    : 0;

  return {
    examHydrated,
    homeworkHydrated,
    konuHydrated: konuTakip.hydrated,
    lastExam,
    homework,
    upcomingExamCount,
    topicSummary,
    topicPercent,
  };
}
