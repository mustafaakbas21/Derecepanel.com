"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { APPOINTMENTS_CHANGE_EVENT } from "@/lib/appointments/constants";
import { notifyNewAppointment } from "@/lib/appointments/notifications";
import { readStudentRoster, findRosterStudent } from "@/lib/appointments/students";
import { loadAppointments, saveAppointments } from "@/lib/appointments/storage";
import type {
  Appointment,
  AppointmentFormValues,
  StatusFilterKey,
  TypeFilterKey,
} from "@/lib/appointments/types";
import {
  applySearchFilter,
  applyStatusFilter,
  applyTypeFilter,
  computeTsFromDateTime,
  sortByTsAsc,
} from "@/lib/appointments/utils";

export function useAppointments() {
  const [list, setList] = useState<Appointment[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilterKey>("all");

  const reload = useCallback(() => {
    setList(loadAppointments());
    setHydrated(true);
  }, []);

  useEffect(() => {
    reload();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "appointments" || e.key === null) reload();
    };
    const onCustom = () => reload();
    window.addEventListener("storage", onStorage);
    window.addEventListener(APPOINTMENTS_CHANGE_EVENT, onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(APPOINTMENTS_CHANGE_EVENT, onCustom);
    };
  }, [reload]);

  const roster = useMemo(() => (hydrated ? readStudentRoster() : []), [hydrated, list]);

  const filtered = useMemo(() => {
    let rows = sortByTsAsc(list);
    rows = applyStatusFilter(rows, statusFilter);
    rows = applyTypeFilter(rows, typeFilter);
    rows = applySearchFilter(rows, search);
    return rows;
  }, [list, statusFilter, typeFilter, search]);

  const persist = useCallback((next: Appointment[]) => {
    saveAppointments(next);
    setList(next);
  }, []);

  const upsert = useCallback(
    (values: AppointmentFormValues, editingId: string | null) => {
      const rosterNow = readStudentRoster();
      const student = findRosterStudent(rosterNow, values.studentId);
      if (!student) return false;

      const ts = computeTsFromDateTime(values.tarih, values.saat);
      const base = {
        studentId: values.studentId,
        ogrenci: student.name,
        tarih: values.tarih,
        saat: values.saat,
        sure: values.sure,
        tip: values.tip,
        status: values.status,
        konu: values.konu.trim(),
        notlar: values.notlar.trim(),
        yer: values.yer.trim(),
        ts,
      };

      if (editingId) {
        const next = list.map((r) => (r.id === editingId ? { ...r, ...base } : r));
        persist(next);
        return true;
      }

      const record: Appointment = {
        id: `rnd-${Date.now()}`,
        ...base,
      };
      persist([...list, record]);

      if (values.notifyStudent) {
        notifyNewAppointment(values.studentId, values.tarih, values.saat);
      }
      return true;
    },
    [list, persist]
  );

  const remove = useCallback(
    (id: string) => {
      persist(list.filter((r) => r.id !== id));
    },
    [list, persist]
  );

  return {
    list,
    hydrated,
    roster,
    filtered,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    reload,
    upsert,
    remove,
  };
}
