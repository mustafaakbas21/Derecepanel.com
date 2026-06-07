"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { CurrentUser } from "@/lib/appointments/types";
import {
  STUDENT_PERSONAL_WEEKLY_CHANGE,
  STUDENT_PERSONAL_WEEKLY_KEY,
  WEEKLY_PROGRAM_PROGRESS_CHANGE,
  WEEKLY_PROGRAM_PROGRESS_KEY,
} from "@/lib/weekly-planner/constants";
import {
  computeProgramCompletion,
  getProgramProgress,
  toggleTaskCompleted,
} from "@/lib/weekly-planner/student-progress";
import {
  currentWeekMondayISO,
  getCoachDisplayName,
  getCurrentUser,
  getPersonalProgramForWeek,
  matchIdsForUser,
} from "@/lib/weekly-planner/student-scope";

export function useStudentPersonalWeeklyProgram(weekMondayISO?: string) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [tick, setTick] = useState(0);
  const [progressTick, setProgressTick] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  const reload = useCallback(() => {
    setUser(getCurrentUser());
    setTick((n) => n + 1);
    setHydrated(true);
  }, []);

  useEffect(() => {
    reload();
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === STUDENT_PERSONAL_WEEKLY_KEY ||
        e.key === WEEKLY_PROGRAM_PROGRESS_KEY ||
        e.key === "currentUser" ||
        e.key === null
      ) {
        reload();
      }
    };
    const onProgress = () => setProgressTick((n) => n + 1);
    window.addEventListener("storage", onStorage);
    window.addEventListener(STUDENT_PERSONAL_WEEKLY_CHANGE, reload);
    window.addEventListener(WEEKLY_PROGRAM_PROGRESS_CHANGE, onProgress);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(STUDENT_PERSONAL_WEEKLY_CHANGE, reload);
      window.removeEventListener(WEEKLY_PROGRAM_PROGRESS_CHANGE, onProgress);
    };
  }, [reload]);

  const coachName = useMemo(() => getCoachDisplayName(user), [user]);
  const scopeKey = useMemo(() => {
    if (!user) return "";
    const ids = matchIdsForUser(user);
    return ids[0] ?? user.id ?? user.ogrenciId ?? "";
  }, [user]);

  const targetWeek = weekMondayISO ?? currentWeekMondayISO();
  const program = useMemo(() => {
    void tick;
    return getPersonalProgramForWeek(user, targetWeek);
  }, [user, targetWeek, tick]);

  const progress = useMemo(() => {
    if (!program || !scopeKey) {
      return { total: 0, done: 0, ratio: 0, studyTotal: 0, studyDone: 0 };
    }
    void progressTick;
    const record = getProgramProgress(scopeKey, program.id);
    return computeProgramCompletion(program.tasks, record.completedTaskIds);
  }, [program, scopeKey, progressTick]);

  const completedIds = useMemo(() => {
    if (!program || !scopeKey) return new Set<string>();
    void progressTick;
    return new Set(getProgramProgress(scopeKey, program.id).completedTaskIds);
  }, [program, scopeKey, progressTick]);

  const toggleTask = useCallback(
    (taskId: string) => {
      if (!program || !scopeKey) return;
      toggleTaskCompleted(scopeKey, program.id, taskId);
      setProgressTick((n) => n + 1);
    },
    [program, scopeKey]
  );

  return {
    user,
    hydrated,
    coachName,
    program,
    targetWeek,
    progress,
    completedIds,
    toggleTask,
    reload,
    isCurrentWeek: targetWeek === currentWeekMondayISO(),
  };
}
