"use client";

import Link from "next/link";
import { Clock } from "lucide-react";

import {
  filterStudentAppointments,
  getCoachDisplayName,
} from "@/lib/appointments/student-scope";
import { useStudentAppointmentsSnapshot } from "@/lib/appointments/use-student-appointments";
import {
  appointmentTs,
  formatTrShortDate,
  initials,
  tipLabel,
} from "@/lib/appointments/utils";
import { STUDENT_ROUTES } from "@/lib/student/sidebar-nav-config";

const MAX_ITEMS = 5;

export function StudentUpcomingAppointments() {
  const { list, coachName, hydrated } = useStudentAppointmentsSnapshot();

  const items = filterStudentAppointments(list, "upcoming", "all").slice(0, MAX_ITEMS);

  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-[1.35rem] bg-white p-6"
      style={{ boxShadow: "var(--card-shadow)" }}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-xl font-bold text-slate-900">Yaklaşan Randevular</h3>
          <p className="mt-0.5 text-[14px] text-slate-400" suppressHydrationWarning>
            {hydrated ? `${items.length} koç görüşmesi` : "Yükleniyor…"}
          </p>
        </div>
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: "#fff7ed" }}
        >
          <span className="text-[13px] font-bold text-orange-600">{initials(coachName)}</span>
        </div>
      </div>

      {hydrated && items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-10 text-center">
          <p className="text-[15px] font-semibold text-slate-700">Yaklaşan randevu yok</p>
          <p className="mt-1 text-[13px] text-slate-400">
            Koçunuz randevu oluşturduğunda burada görünür.
          </p>
        </div>
      ) : (
        <ul className="flex flex-1 flex-col gap-1">
          {items.map((a) => {
            const when = new Date(appointmentTs(a));
            const saat =
              a.saat ||
              when.toLocaleTimeString("tr-TR", {
                hour: "2-digit",
                minute: "2-digit",
              });
            return (
              <li
                key={a.id}
                className="flex items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-slate-50"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #f97316, #fb923c)" }}
                >
                  {initials(coachName)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-slate-800">
                    {coachName}
                  </p>
                  <p className="truncate text-[13px] text-slate-400">
                    {a.konu?.trim() || "Görüşme"} · {tipLabel(a.tip)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[13px] font-semibold text-slate-700">
                    {formatTrShortDate(a.tarih)}
                  </p>
                  <p className="flex items-center justify-end gap-1 text-[12px] text-slate-400">
                    <Clock className="h-3 w-3" />
                    {saat}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Link
        href={STUDENT_ROUTES.randevular}
        className="mt-4 text-[13px] font-semibold text-slate-700 transition hover:text-slate-900"
      >
        Randevulara git →
      </Link>
    </div>
  );
}
