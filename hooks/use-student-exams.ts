"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { onExamResultsChange, onExamsChange } from "@/lib/exams/events";
import {
  computeStudentExamStats,
  filterStudentExams,
  groupUpcomingExams,
  listStudentPastExams,
  listStudentUpcomingExams,
  type StudentExamScope,
  type StudentExamStats,
  type StudentExamTimelineGroup,
  type StudentExamView,
} from "@/lib/student/student-exams-scope";

export function useStudentExams() {
  const [hydrated, setHydrated] = useState(false);
  const [upcoming, setUpcoming] = useState<StudentExamView[]>([]);
  const [past, setPast] = useState<StudentExamView[]>([]);
  const [stats, setStats] = useState<StudentExamStats>({
    upcomingTotal: 0,
    kurumsalUpcoming: 0,
    globalUpcoming: 0,
    pastWithResult: 0,
    lastNet: null,
    nextExam: null,
  });

  const reload = useCallback(() => {
    setUpcoming(listStudentUpcomingExams("all"));
    setPast(listStudentPastExams(8));
    setStats(computeStudentExamStats());
    setHydrated(true);
  }, []);

  useEffect(() => {
    reload();
    const onChange = () => reload();
    const offExams = onExamsChange(onChange);
    const offResults = onExamResultsChange(onChange);
    return () => {
      offExams();
      offResults();
    };
  }, [reload]);

  return { hydrated, upcoming, past, stats, reload };
}

export function useFilteredStudentExams(
  upcoming: StudentExamView[],
  scope: StudentExamScope,
  sinav: "all" | "TYT" | "AYT" | "YDT",
  search: string
) {
  const filtered = useMemo(
    () => filterStudentExams(upcoming, { scope, sinav, search }),
    [upcoming, scope, sinav, search]
  );

  const groups = useMemo((): StudentExamTimelineGroup[] => groupUpcomingExams(filtered), [filtered]);

  return { filtered, groups };
}
