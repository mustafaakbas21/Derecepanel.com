"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { onExamResultsChange } from "@/lib/exams/events";
import type { ExamResultRow } from "@/lib/exams/types";
import {
  buildStudentNetTrendPoints,
  latestStudentExamNet,
  readStudentExamResults,
  studentExamResultIds,
  type NetTrendPoint,
} from "@/lib/student/exam-results-scope";

export function useStudentExamResults() {
  const [results, setResults] = useState<ExamResultRow[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const studentIds = useMemo(() => studentExamResultIds(), []);

  const reload = useCallback(() => {
    setResults(readStudentExamResults(studentIds));
    setHydrated(true);
  }, [studentIds]);

  useEffect(() => {
    reload();
    return onExamResultsChange(reload);
  }, [reload]);

  const netTrend = useMemo((): NetTrendPoint[] => {
    void results;
    return buildStudentNetTrendPoints(studentIds, 10);
  }, [results, studentIds]);

  const lastNet = useMemo(() => {
    void results;
    return latestStudentExamNet(studentIds);
  }, [results, studentIds]);

  return { results, netTrend, lastNet, hydrated, studentIds, reload };
}
