"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, Clock } from "lucide-react";

import { APPOINTMENTS_CHANGE_EVENT } from "@/lib/appointments/constants";
import { loadAppointments } from "@/lib/appointments/storage";
import type { Appointment } from "@/lib/appointments/types";
import {
  appointmentTs,
  applyStatusFilter,
  avatarStyle,
  formatTrShortDate,
  initials,
  sortByTsAsc,
  tipLabel,
} from "@/lib/appointments/utils";

const MAX_ITEMS = 5;

function readUpcoming(): Appointment[] {
  if (typeof window === "undefined") return [];
  return sortByTsAsc(applyStatusFilter(loadAppointments(), "upcoming"));
}

export function UpcomingAppointments() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setItems(readUpcoming());
      setHydrated(true);
    };
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "appointments" || e.key === null) refresh();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(APPOINTMENTS_CHANGE_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(APPOINTMENTS_CHANGE_EVENT, refresh);
    };
  }, []);

  const visible = items.slice(0, MAX_ITEMS);

  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-[1.35rem] bg-white p-6"
      style={{ boxShadow: "var(--card-shadow)" }}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-xl font-bold text-slate-900">Yaklaşan Randevular</h3>
          <p className="mt-0.5 text-[14px] text-slate-400" suppressHydrationWarning>
            {hydrated ? `${items.length} yaklaşan randevu` : "Yükleniyor…"}
          </p>
        </div>
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: "#fff7ed" }}
        >
          <CalendarDays className="h-5 w-5 text-orange-500" strokeWidth={2} />
        </div>
      </div>

      {hydrated && visible.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-10 text-center">
          <p className="text-[15px] font-semibold text-slate-700">
            Yaklaşan randevu yok
          </p>
          <p className="mt-1 text-[13px] text-slate-400">
            Yeni randevu eklediğinizde burada listelenir.
          </p>
        </div>
      ) : (
        <ul className="flex flex-1 flex-col gap-1">
          {visible.map((a) => {
            const when = new Date(appointmentTs(a));
            const saat = a.saat || when.toLocaleTimeString("tr-TR", {
              hour: "2-digit",
              minute: "2-digit",
            });
            return (
              <li
                key={a.id}
                className="flex items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-slate-50"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
                  style={avatarStyle(a.ogrenci)}
                >
                  {initials(a.ogrenci)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-slate-800">
                    {a.ogrenci || "Öğrenci"}
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
        href="/dashboard/randevular"
        className="mt-4 text-[13px] font-semibold text-blue-600 transition hover:text-blue-700"
      >
        Randevulara git →
      </Link>
    </div>
  );
}
