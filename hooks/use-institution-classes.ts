"use client";

import { useCallback, useEffect, useState } from "react";

import { onClassesChange } from "@/lib/classes/events";
import {
  deleteInstitutionClass,
  loadInstitutionClasses,
  upsertInstitutionClass,
} from "@/lib/classes/storage";
import type { ClassDraft, InstitutionClass } from "@/lib/classes/types";

export function useInstitutionClasses() {
  const [classes, setClasses] = useState<InstitutionClass[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(() => {
    setClasses(loadInstitutionClasses());
    setHydrated(true);
  }, []);

  useEffect(() => {
    refresh();
    return onClassesChange(refresh);
  }, [refresh]);

  const saveClass = useCallback(
    (draft: ClassDraft) => {
      const saved = upsertInstitutionClass(draft);
      setClasses(loadInstitutionClasses());
      return saved;
    },
    []
  );

  const removeClass = useCallback((id: string) => {
    deleteInstitutionClass(id);
    setClasses(loadInstitutionClasses());
  }, []);

  const setClassesOptimistic = useCallback((next: InstitutionClass[]) => {
    setClasses(next);
  }, []);

  return {
    classes,
    hydrated,
    refresh,
    saveClass,
    removeClass,
    setClassesOptimistic,
  };
}
