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

function readStudentsSync(seedIfEmpty?: boolean): StudentRecord[] {
  if (typeof window === "undefined") return [];
  return loadStudentsFull({ seedIfEmpty });
}

/**
 * Modül seviyesi bayrak: ilk SSR hydration tamamlanana kadar `false`.
 * Böylece ilk render sunucuyla birebir aynı (boş) olur → hydration mismatch yok;
 * sonraki istemci-içi navigasyonlarda doğrudan localStorage okunur → flaş yok.
 */
let hasHydrated = false;

export function useStudentsFull(options?: { seedIfEmpty?: boolean }) {
  const seed = options?.seedIfEmpty;
  const [students, setStudents] = useState<StudentRecord[]>(() =>
    hasHydrated ? readStudentsSync(seed) : []
  );
  const [hydrated, setHydrated] = useState(hasHydrated);

  const reload = useCallback(() => {
    setStudents(readStudentsSync(seed));
    setHydrated(true);
  }, [seed]);

  useEffect(() => {
    hasHydrated = true;
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
