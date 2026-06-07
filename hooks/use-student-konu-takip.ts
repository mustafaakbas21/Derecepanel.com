"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useKonuTakip } from "@/hooks/use-konu-takip";
import {
  findStudentRecordForUser,
  getCoachDisplayName,
  getCurrentUser,
  resolveStudentTrackingId,
} from "@/lib/konu-takip/student-scope";
import type { StudentTracking } from "@/lib/konu-takip/types";
import type { CurrentUser } from "@/lib/appointments/types";
import type { StudentRecord } from "@/lib/students/types";

export function useStudentKonuTakip() {
  const { store, hydrated: storeHydrated, reload, trackingFor } = useKonuTakip();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [record, setRecord] = useState<StudentRecord | null>(null);
  const [studentId, setStudentId] = useState("");
  const [hydrated, setHydrated] = useState(false);

  const refreshUser = useCallback(() => {
    const current = getCurrentUser();
    const rec = findStudentRecordForUser(current);
    const sid = resolveStudentTrackingId(current);
    setUser(current);
    setRecord(rec);
    setStudentId(sid);
    setHydrated(true);
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser, storeHydrated]);

  const tracking = useMemo((): StudentTracking => {
    if (!studentId) return {};
    return trackingFor(studentId);
  }, [trackingFor, studentId, store]);

  const coachName = useMemo(() => getCoachDisplayName(user), [user]);

  return {
    user,
    record,
    studentId,
    tracking,
    store,
    coachName,
    hydrated: hydrated && storeHydrated,
    reload,
  };
}
