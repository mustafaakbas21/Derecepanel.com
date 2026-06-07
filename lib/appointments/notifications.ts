import type { StudentNotification } from "@/lib/appointments/types";
import { formatDdMmFromIso } from "@/lib/appointments/utils";

import { panelGetItem, panelRemoveItem, panelSetItem } from "@/lib/panel-store";
function notificationKey(studentId: string) {
  return `student_notifications_${studentId}`;
}

export function pushStudentNotification(studentId: string, item: StudentNotification) {
  if (!studentId || typeof window === "undefined") return;
  const key = notificationKey(studentId);
  try {
    const raw = panelGetItem(key);
    const list: StudentNotification[] = raw ? (JSON.parse(raw) as StudentNotification[]) : [];
    if (!Array.isArray(list)) return;
    list.unshift(item);
    panelSetItem(key, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function notifyNewAppointment(
  studentId: string,
  tarih: string,
  saat: string
) {
  pushStudentNotification(studentId, {
    type: "randevu",
    text: `Yeni Randevu: ${formatDdMmFromIso(tarih)} Saat ${saat}`,
    read: false,
  });
}
