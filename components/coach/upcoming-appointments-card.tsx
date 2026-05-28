"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";

import { APPOINTMENTS_CHANGE_EVENT } from "@/lib/appointments/constants";
import { loadAppointments } from "@/lib/appointments/storage";
import { countUpcoming } from "@/lib/appointments/utils";

export function UpcomingAppointmentsCard() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const refresh = () => setCount(countUpcoming(loadAppointments()));
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

  return (
    <Link
      href="/dashboard/randevular"
      className="relative block overflow-hidden rounded-[1.35rem] bg-white p-6 transition hover:ring-2 hover:ring-blue-100"
      style={{ boxShadow: "var(--card-shadow)" }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[15px] font-medium text-slate-500">Yaklaşan randevu</p>
          <p className="mt-2 text-[2.125rem] font-bold leading-none tracking-tight text-slate-900">
            {count}
          </p>
          <p className="mt-2 text-[13px] text-blue-600 font-medium">Randevulara git →</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50">
          <CalendarDays className="h-5 w-5 text-blue-600" strokeWidth={2} />
        </div>
      </div>
    </Link>
  );
}
