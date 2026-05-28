"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Video } from "lucide-react";

import { FilterSegments } from "@/components/appointments/filter-segments";
import { Badge } from "@/components/ui/badge";
import { APPOINTMENTS_CHANGE_EVENT } from "@/lib/appointments/constants";
import { catalogIdForUser } from "@/lib/appointments/catalog";
import { getCurrentUser } from "@/lib/appointments/current-user";
import { loadAppointments } from "@/lib/appointments/storage";
import type { Appointment } from "@/lib/appointments/types";
import {
  appointmentTs,
  belongsToStudent,
  formatTrShortDate,
  isZoomableUrl,
  normName,
  studentMatchIds,
  tipLabel,
} from "@/lib/appointments/utils";
import { cn } from "@/lib/utils";

type TabKey = "upcoming" | "past";

function StudentAppointmentCard({ r }: { r: Appointment }) {
  const konu = r.konu?.trim() || "Görüşme";
  const online = r.tip === "online";
  const link = String(r.yer || "").trim();

  return (
    <article
      className="rounded-[1.25rem] border border-slate-200/80 bg-white p-5"
      style={{ boxShadow: "var(--card-shadow)" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1 text-sm text-slate-600">
          <p className="text-base font-semibold text-slate-900">
            {formatTrShortDate(r.tarih)}
          </p>
          <p>Saat: {r.saat || "—"}</p>
        </div>
        <Badge
          className={cn(
            r.tip === "online" && "border-sky-200 bg-sky-50 text-sky-700",
            r.tip === "telefon" && "border-teal-200 bg-teal-50 text-teal-700",
            r.tip === "yuz_yuze" && "border-slate-200 bg-slate-50"
          )}
        >
          {tipLabel(r.tip)}
        </Badge>
      </div>
      <p className="mt-3 text-sm text-slate-700">
        <span className="font-semibold text-slate-900">Konu:</span> {konu}
      </p>
      {online && isZoomableUrl(link) ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <Video className="h-4 w-4" />
          Zoom / Meet linkine git
          <ExternalLink className="h-3.5 w-3.5 opacity-80" />
        </a>
      ) : null}
    </article>
  );
}

export function StudentAppointmentsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("upcoming");
  const [list, setList] = useState<Appointment[]>([]);
  const [ready, setReady] = useState(false);

  const reload = useCallback(() => {
    const user = getCurrentUser();
    if (!user) {
      setReady(true);
      return;
    }
    const matchIds = studentMatchIds(user, catalogIdForUser(user));
    const myName = normName(user.name ?? "");
    const mine = loadAppointments().filter((r) => belongsToStudent(r, matchIds, myName));
    setList(mine);
    setReady(true);
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

  const [user, setUser] = useState<ReturnType<typeof getCurrentUser>>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, [ready]);

  useEffect(() => {
    if (ready && !user) router.replace("/");
  }, [ready, user, router]);

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const up: Appointment[] = [];
    const pa: Appointment[] = [];
    for (const r of list) {
      const ts = appointmentTs(r);
      if (Number.isNaN(ts)) continue;
      if (ts >= now) up.push(r);
      else pa.push(r);
    }
    up.sort((a, b) => appointmentTs(a) - appointmentTs(b));
    pa.sort((a, b) => appointmentTs(b) - appointmentTs(a));
    return { upcoming: up, past: pa };
  }, [list]);

  const visible = tab === "upcoming" ? upcoming : past;

  if (!ready) {
    return <p className="text-sm text-slate-500">Yükleniyor…</p>;
  }

  if (!user) {
    return (
      <p className="text-sm text-slate-500">
        Oturum bulunamadı.{" "}
        <Link href="/" className="font-medium text-blue-600 underline">
          Giriş sayfasına dön
        </Link>
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Randevularım</h1>
        <p className="mt-1 text-[15px] text-slate-500">
          Koçunuzla planlanan görüşmeler — salt okunur liste.
        </p>
      </header>

      <FilterSegments
        ariaLabel="Zaman sekmesi"
        options={[
          { value: "upcoming" as const, label: `Gelecek (${upcoming.length})` },
          { value: "past" as const, label: `Geçmiş (${past.length})` },
        ]}
        value={tab}
        onChange={setTab}
      />

      {visible.length === 0 ? (
        <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
          <p className="font-semibold text-slate-900">
            {tab === "upcoming" ? "Yaklaşan randevu yok" : "Geçmiş randevu yok"}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Koçunuz yeni randevu eklediğinde burada görünecek.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((r) => (
            <StudentAppointmentCard key={r.id} r={r} />
          ))}
        </div>
      )}
    </div>
  );
}
