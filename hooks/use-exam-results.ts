"use client";

import { useCallback, useEffect, useState } from "react";

import { readCoachScopedExamResults } from "@/lib/exams/exam-results-storage";
import { onExamResultsChange, onExamsChange } from "@/lib/exams/events";
import type { ExamResultRow } from "@/lib/exams/types";

export function useExamResults() {
  const [results, setResults] = useState<ExamResultRow[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(() => {
    setResults(readCoachScopedExamResults());
    setHydrated(true);
  }, []);

  useEffect(() => {
    refresh();
    const offResults = onExamResultsChange(() => refresh());
    const offExams = onExamsChange(() => refresh());
    return () => {
      offResults();
      offExams();
    };
  }, [refresh]);

  return { results, hydrated, refresh };
}
