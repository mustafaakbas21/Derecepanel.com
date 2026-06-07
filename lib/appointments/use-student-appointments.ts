"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { APPOINTMENTS_CHANGE_EVENT } from "@/lib/appointments/constants";
import { getCurrentUser } from "@/lib/appointments/current-user";
import {
  filterStudentAppointments,
  getCoachDisplayName,
  loadStudentAppointments,
} from "@/lib/appointments/student-scope";
import type { Appointment, CurrentUser, StatusFilterKey, TypeFilterKey } from "@/lib/appointments/types";

export function useStudentAppointments() {
  const [list, setList] = useState<Appointment[]>([]);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>("upcoming");
  const [typeFilter, setTypeFilter] = useState<TypeFilterKey>("all");

  const reload = useCallback(() => {
    const current = getCurrentUser();
    setUser(current);
    setList(loadStudentAppointments(current));
    setHydrated(true);
  }, []);

  useEffect(() => {
    reload();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "appointments" || e.key === "currentUser" || e.key === null) reload();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(APPOINTMENTS_CHANGE_EVENT, reload);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(APPOINTMENTS_CHANGE_EVENT, reload);
    };
  }, [reload]);

  const coachName = useMemo(() => getCoachDisplayName(user), [user]);

  const filtered = useMemo(() => {
    const out = filterStudentAppointments(list, statusFilter, typeFilter);
    if (statusFilter === "upcoming") return out;
    return [...out].reverse();
  }, [list, statusFilter, typeFilter]);

  const counts = useMemo(() => {
    const now = new Date();
    return {
      all: list.length,
      upcoming: filterStudentAppointments(list, "upcoming", "all", now).length,
      done: filterStudentAppointments(list, "done", "all", now).length,
      cancelled: filterStudentAppointments(list, "cancelled", "all", now).length,
    };
  }, [list]);

  return {
    list,
    user,
    hydrated,
    coachName,
    filtered,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    counts,
    reload,
  };
}

export function useStudentAppointmentsSnapshot() {
  const [list, setList] = useState<Appointment[]>([]);
  const [coachName, setCoachName] = useState("");
  const [hydrated, setHydrated] = useState(false);

  const reload = useCallback(() => {
    const user = getCurrentUser();
    setList(loadStudentAppointments(user));
    setCoachName(getCoachDisplayName(user));
    setHydrated(true);
  }, []);

  useEffect(() => {
    reload();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "appointments" || e.key === "currentUser" || e.key === null) reload();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(APPOINTMENTS_CHANGE_EVENT, reload);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(APPOINTMENTS_CHANGE_EVENT, reload);
    };
  }, [reload]);

  return { list, coachName, hydrated, reload };
}
