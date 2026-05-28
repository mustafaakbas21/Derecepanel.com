"use client";

import { useCallback, useEffect, useState } from "react";

import { STORAGE_KEY, CATALOG_KEY } from "@/lib/students/constants";
import { STUDENTS_CHANGE_EVENT } from "@/lib/students/events";
import { loadStudentsFull } from "@/lib/students/storage";
import type { StudentRecord } from "@/lib/students/types";

const WATCH_KEYS = new Set([
  STORAGE_KEY,
  CATALOG_KEY,
  "derecepanel_students_full_v1",
  "students_v0",
  "students",
]);

export function useStudentsFull(options?: { seedIfEmpty?: boolean }) {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const reload = useCallback(() => {
    setStudents(loadStudentsFull({ seedIfEmpty: options?.seedIfEmpty }));
    setHydrated(true);
  }, [options?.seedIfEmpty]);

  useEffect(() => {
    reload();
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || (e.key && WATCH_KEYS.has(e.key))) reload();
    };
    const onCustom = () => reload();
    window.addEventListener("storage", onStorage);
    window.addEventListener(STUDENTS_CHANGE_EVENT, onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(STUDENTS_CHANGE_EVENT, onCustom);
    };
  }, [reload]);

  return { students, hydrated, reload };
}
