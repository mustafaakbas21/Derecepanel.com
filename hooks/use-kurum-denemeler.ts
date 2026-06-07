"use client";

import { useCallback, useEffect, useState } from "react";

import {
  deleteKurumDeneme,
  enrichKurumDeneme,
  loadKurumDenemeler,
  upsertKurumDeneme,
} from "@/lib/exams/exam-storage";
import { onExamResultsChange, onExamsChange } from "@/lib/exams/events";
import type { KurumDeneme } from "@/lib/exams/types";

export function useKurumDenemeler() {
  const [list, setList] = useState<KurumDeneme[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(() => {
    setList(loadKurumDenemeler().map(enrichKurumDeneme));
    setHydrated(true);
  }, []);

  useEffect(() => {
    refresh();
    const offExams = onExamsChange(refresh);
    const offResults = onExamResultsChange(() => refresh());
    return () => {
      offExams();
      offResults();
    };
  }, [refresh]);

  const save = useCallback(
    (item: KurumDeneme) => {
      upsertKurumDeneme(item);
      refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    (id: string) => {
      deleteKurumDeneme(id);
      refresh();
    },
    [refresh]
  );

  return { list, hydrated, refresh, save, remove };
}
