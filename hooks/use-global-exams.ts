"use client";

import { useCallback, useEffect, useState } from "react";

import { onExamsChange, onGlobalDenemelerUpdated } from "@/lib/exams/events";
import {
  deleteGlobalExam,
  enrichGlobalExam,
  loadGlobalExams,
  upsertGlobalExam,
} from "@/lib/exams/global-exam-storage";
import type { GlobalExam } from "@/lib/exams/types";

export function useGlobalExams() {
  const [list, setList] = useState<GlobalExam[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(() => {
    setList(loadGlobalExams().map(enrichGlobalExam));
    setHydrated(true);
  }, []);

  useEffect(() => {
    refresh();
    const off1 = onGlobalDenemelerUpdated(refresh);
    const off2 = onExamsChange(refresh);
    const tick = window.setInterval(refresh, 60_000);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      off1();
      off2();
      window.clearInterval(tick);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [refresh]);

  const save = useCallback(
    (item: GlobalExam) => {
      upsertGlobalExam(item);
      refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    (id: string) => {
      deleteGlobalExam(id);
      refresh();
    },
    [refresh]
  );

  return { list, hydrated, refresh, save, remove };
}
