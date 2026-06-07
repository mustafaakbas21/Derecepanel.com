import { panelGetItem, panelRemoveItem, panelSetItem } from "@/lib/panel-store";
import {
  APPOINTMENTS_CHANGE_EVENT,
  APPOINTMENTS_KEY,
  LEGACY_APPOINTMENTS_KEY,
} from "@/lib/appointments/constants";
import type { Appointment } from "@/lib/appointments/types";
import { normalizeAppointment } from "@/lib/appointments/utils";

export function dispatchAppointmentsChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(APPOINTMENTS_CHANGE_EVENT));
  void import("@/lib/coach/actions/revalidate-dashboard").then((m) =>
    m.revalidateCoachDashboard()
  );
}

export function loadAppointments(): Appointment[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = panelGetItem(APPOINTMENTS_KEY);
    if (raw != null && raw !== "") {
      const arr = JSON.parse(raw) as Appointment[];
      if (Array.isArray(arr)) return arr.map(normalizeAppointment);
    }
  } catch {
    /* fall through */
  }

  try {
    const leg = panelGetItem(LEGACY_APPOINTMENTS_KEY);
    if (!leg) return [];
    const old = JSON.parse(leg) as Appointment[];
    if (!Array.isArray(old) || !old.length) return [];
    const migrated = old.map((r) =>
      normalizeAppointment({
        ...r,
        studentId: r.studentId || "",
        ogrenci: r.ogrenci || "",
      })
    );
    try {
      panelSetItem(APPOINTMENTS_KEY, JSON.stringify(migrated));
    } catch {
      /* ignore */
    }
    return migrated;
  } catch {
    return [];
  }
}

export function saveAppointments(arr: Appointment[]) {
  if (typeof window === "undefined") return;
  try {
    panelSetItem(APPOINTMENTS_KEY, JSON.stringify(arr));
    dispatchAppointmentsChange();
  } catch {
    /* ignore */
  }
}
