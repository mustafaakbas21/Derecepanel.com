"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { LIBRARY_ASSIGNMENTS_KEY, LIBRARY_BOOKS_KEY, LIBRARY_CHANGED_EVENT } from "@/lib/library/constants";
import {
  computeStudentLibraryStats,
  getCoachDisplayName,
  getCurrentUser,
  listStudentAssignments,
  type StudentAssignmentView,
} from "@/lib/library/student-scope";
import { setAssignmentProgress } from "@/lib/library/library-storage";
import type { CurrentUser } from "@/lib/appointments/types";

export function useStudentLibrary() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [assignments, setAssignments] = useState<StudentAssignmentView[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const reload = useCallback(() => {
    const current = getCurrentUser();
    setUser(current);
    setAssignments(listStudentAssignments(current));
    setHydrated(true);
  }, []);

  useEffect(() => {
    reload();
    const onChange = () => reload();
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === LIBRARY_BOOKS_KEY ||
        e.key === LIBRARY_ASSIGNMENTS_KEY ||
        e.key === "currentUser" ||
        e.key === null
      ) {
        reload();
      }
    };
    window.addEventListener(LIBRARY_CHANGED_EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(LIBRARY_CHANGED_EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, [reload]);

  const stats = useMemo(() => computeStudentLibraryStats(assignments), [assignments]);
  const coachName = useMemo(() => getCoachDisplayName(user), [user]);

  const updateProgress = useCallback(
    (assignmentId: string, pct: number) => {
      setAssignmentProgress(assignmentId, pct);
      reload();
    },
    [reload]
  );

  return {
    user,
    assignments,
    stats,
    coachName,
    hydrated,
    reload,
    updateProgress,
  };
}
