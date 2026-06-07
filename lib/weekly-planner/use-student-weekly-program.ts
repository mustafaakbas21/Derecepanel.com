"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { catalogIdForUser } from "@/lib/appointments/catalog";
import type { CurrentUser } from "@/lib/appointments/types";
import {
  WEEKLY_PROGRAM_INBOX_CHANGE,
  WEEKLY_PROGRAM_INBOX_KEY,
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
  getWeeklyProgramForWeek,
  listPastWeeklyPrograms,
  listStudentWeeklyInboxForUser,
  matchIdsForUser,
} from "@/lib/weekly-planner/student-scope";
import type { StudentWeeklyInboxItem } from "@/lib/weekly-planner/saved-programs";

export function useStudentWeeklyProgram(weekMondayISO?: string) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [inbox, setInbox] = useState<StudentWeeklyInboxItem[]>([]);
  const [progressTick, setProgressTick] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  const reload = useCallback(() => {
    const current = getCurrentUser();
    setUser(current);
    setInbox(listStudentWeeklyInboxForUser(current));
    setHydrated(true);
  }, []);

  useEffect(() => {
    reload();
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === WEEKLY_PROGRAM_INBOX_KEY ||
        e.key === WEEKLY_PROGRAM_PROGRESS_KEY ||
        e.key === "currentUser" ||
        e.key === null
      ) {
        reload();
      }
    };
    const onProgress = () => setProgressTick((n) => n + 1);
    window.addEventListener("storage", onStorage);
    window.addEventListener(WEEKLY_PROGRAM_INBOX_CHANGE, reload);
    window.addEventListener(WEEKLY_PROGRAM_PROGRESS_CHANGE, onProgress);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(WEEKLY_PROGRAM_INBOX_CHANGE, reload);
      window.removeEventListener(WEEKLY_PROGRAM_PROGRESS_CHANGE, onProgress);
    };
  }, [reload]);

  const coachName = useMemo(() => getCoachDisplayName(user), [user]);
  const scopeKey = useMemo(() => {
    if (!user) return "";
    const ids = matchIdsForUser(user, catalogIdForUser(user));
    return ids[0] ?? user.id ?? user.ogrenciId ?? "";
  }, [user]);

  const targetWeek = weekMondayISO ?? currentWeekMondayISO();
  const program = useMemo(
    () => getWeeklyProgramForWeek(user, targetWeek),
    [user, targetWeek, inbox]
  );

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

  const pastPrograms = useMemo(() => listPastWeeklyPrograms(user), [user, inbox]);

  return {
    user,
    hydrated,
    coachName,
    program,
    targetWeek,
    progress,
    completedIds,
    toggleTask,
    pastPrograms,
    inbox,
    reload,
    isCurrentWeek: targetWeek === currentWeekMondayISO(),
  };
}

export function useStudentWeeklyProgramHistory() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [programs, setPrograms] = useState<StudentWeeklyInboxItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [progressTick, setProgressTick] = useState(0);

  const reload = useCallback(() => {
    const current = getCurrentUser();
    setUser(current);
    setPrograms(listPastWeeklyPrograms(current));
    setHydrated(true);
  }, []);

  useEffect(() => {
    reload();
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === WEEKLY_PROGRAM_INBOX_KEY ||
        e.key === WEEKLY_PROGRAM_PROGRESS_KEY ||
        e.key === "currentUser" ||
        e.key === null
      ) {
        reload();
      }
    };
    const onProgress = () => setProgressTick((n) => n + 1);
    window.addEventListener("storage", onStorage);
    window.addEventListener(WEEKLY_PROGRAM_INBOX_CHANGE, reload);
    window.addEventListener(WEEKLY_PROGRAM_PROGRESS_CHANGE, onProgress);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(WEEKLY_PROGRAM_INBOX_CHANGE, reload);
      window.removeEventListener(WEEKLY_PROGRAM_PROGRESS_CHANGE, onProgress);
    };
  }, [reload]);

  const coachName = useMemo(() => getCoachDisplayName(user), [user]);
  const scopeKey = useMemo(() => {
    if (!user) return "";
    const ids = matchIdsForUser(user, catalogIdForUser(user));
    return ids[0] ?? user.id ?? user.ogrenciId ?? "";
  }, [user]);

  return { user, hydrated, coachName, programs, scopeKey, progressTick, reload };
}
