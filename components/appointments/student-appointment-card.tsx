"use client";

import { useMemo } from "react";
import {
  CalendarDays,
  CalendarRange,
  Clock,
  MapPin,
  Phone,
  Video,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Appointment } from "@/lib/appointments/types";
import {
  appointmentCountdownLabel,
  daysUntilAppointment,
} from "@/lib/appointments/student-scope";
import {
  countUpcoming,
  formatTrShortDate,
  getEffectiveStatus,
  getStatusBadgeText,
  initials,
  isZoomableUrl,
  tipLabel,
  weekMetrics,
} from "@/lib/appointments/utils";
import { cn } from "@/lib/utils";

function statusBadgeVariant(r: Appointment): "high" | "low" | "blue" | "medium" {
  const eff = getEffectiveStatus(r);
  if (eff === "iptal") return "high";
  if (eff === "tamamlandi") return "low";
  return "blue";
}

function tipPillClass(tip: Appointment["tip"]) {
  if (tip === "online") return "border-sky-200 bg-sky-50 text-sky-700";
  if (tip === "telefon") return "border-teal-200 bg-teal-50 text-teal-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function dateParts(iso: string) {
  const p = String(iso || "").split("-").map(Number);
  if (p.length < 3 || Number.isNaN(p[2])) return { day: "—", month: "" };
  const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  return { day: String(p[2]), month: months[(p[1] ?? 1) - 1] ?? "" };
}

export function StudentAppointmentCard({
  appointment: r,
  coachName,
  featured = false,
}: {
  appointment: Appointment;
  coachName: string;
  featured?: boolean;
}) {
  const konu = r.konu?.trim() || "Görüşme";
  const link = String(r.yer || "").trim();
  const online = r.tip === "online";
  const phone = r.tip === "telefon";
  const inPerson = r.tip === "yuz_yuze";
  const countdown = appointmentCountdownLabel(r);
  const days = daysUntilAppointment(r);
  const isSoon = days != null && days >= 0 && days <= 2 && getEffectiveStatus(r) === "bekliyor";
  const { day, month } = dateParts(r.tarih);
  const cancelled = getEffectiveStatus(r) === "iptal";

  return (
    <article
      className={cn(
        "relative flex flex-col overflow-hidden rounded-[1.35rem] border bg-white transition",
        featured
          ? "border-slate-900/10 shadow-lg"
          : "border-slate-200/80 hover:border-slate-300",
        cancelled && "opacity-75"
      )}
      style={{ boxShadow: featured ? "0 12px 40px rgba(15,23,42,0.08)" : "var(--card-shadow)" }}
    >
      {isSoon && !cancelled ? (
        <div
          className="absolute right-0 top-0 rounded-bl-xl px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white"
          style={{ background: "linear-gradient(135deg, #f97316, #fb923c)" }}
        >
          {countdown}
        </div>
      ) : null}

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex shrink-0 flex-col items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-center",
              featured ? "min-w-[72px]" : "min-w-[64px]"
            )}
          >
            <span className="text-2xl font-bold leading-none text-slate-900">{day}</span>
            <span className="mt-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
              {month}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                  tipPillClass(r.tip)
                )}
              >
                {tipLabel(r.tip)}
              </span>
              <Badge variant={statusBadgeVariant(r)}>{getStatusBadgeText(r)}</Badge>
            </div>
            <h3 className="mt-2 text-lg font-bold text-slate-900">{konu}</h3>
            <p className="mt-0.5 text-[14px] text-slate-500">
              {coachName} ile · {r.sure} dk
            </p>
          </div>

          <div
            className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white sm:flex"
            style={{ background: "linear-gradient(135deg, #f97316, #fb923c)" }}
            aria-hidden
          >
            {initials(coachName)}
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-[13px] text-slate-600">
            <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
            <span>{formatTrShortDate(r.tarih)}</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-[13px] text-slate-600">
            <Clock className="h-4 w-4 shrink-0 text-slate-400" />
            <span>{r.saat || "—"}</span>
          </div>
        </div>

        {inPerson && link ? (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 text-[13px] text-slate-600">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <span>{link}</span>
          </div>
        ) : null}

        {phone ? (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-teal-100 bg-teal-50/50 px-3 py-2.5 text-[13px] text-teal-800">
            <Phone className="h-4 w-4 shrink-0" />
            <span>Koçunuz belirtilen saatte sizi arayacak.</span>
          </div>
        ) : null}

        {online && isZoomableUrl(link) && getEffectiveStatus(r) === "bekliyor" ? (
          <Button
            asChild
            variant="primary"
            className="mt-4 w-full"
          >
            <a href={link} target="_blank" rel="noopener noreferrer">
              <Video className="mr-2 h-4 w-4" />
              Görüşmeye katıl
            </a>
          </Button>
        ) : null}

        {!featured && countdown && getEffectiveStatus(r) === "bekliyor" && !isSoon ? (
          <p className="mt-3 text-[13px] font-medium text-orange-600">{countdown}</p>
        ) : null}
      </div>
    </article>
  );
}

export function StudentNextAppointmentHero({
  appointment,
  coachName,
}: {
  appointment: Appointment;
  coachName: string;
}) {
  const countdown = appointmentCountdownLabel(appointment);
  const konu = appointment.konu?.trim() || "Görüşme";

  return (
    <section
      className="overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white"
      style={{ boxShadow: "var(--card-shadow)" }}
      aria-label="Sıradaki randevu"
    >
      <div className="border-b border-slate-100 bg-slate-900 px-6 py-4 text-white">
        <p className="text-[12px] font-semibold uppercase tracking-widest text-slate-400">
          Sıradaki görüşme
        </p>
        <p className="mt-1 text-xl font-bold">{countdown || "Yakında"}</p>
      </div>
      <div className="p-2">
        <StudentAppointmentCard
          appointment={appointment}
          coachName={coachName}
          featured
        />
      </div>
      <p className="px-6 pb-5 text-[13px] text-slate-500">
        <span className="font-semibold text-slate-700">{coachName}</span> ile planlanan{" "}
        <span className="font-medium text-slate-700">{konu}</span> görüşmesi.
      </p>
    </section>
  );
}

export function StudentAppointmentInsights({ list }: { list: Appointment[] }) {
  const m = useMemo(() => {
    return {
      week: weekMetrics(list),
      upcoming: countUpcoming(list),
    };
  }, [list]);

  const tiles = [
    {
      label: "Yaklaşan",
      value: String(m.upcoming),
      sub: "Onaylı görüşme",
      icon: CalendarDays,
    },
    {
      label: "Bu hafta",
      value: String(m.week.total),
      sub: m.week.rangeLabel,
      icon: CalendarRange,
    },
    {
      label: "En yoğun gün",
      value: m.week.total === 0 ? "—" : (m.week.peakDay ?? "—"),
      sub:
        m.week.peakCount > 0 ? `${m.week.peakCount} görüşme` : "Bu hafta randevu yok",
      icon: Clock,
    },
  ];

  return (
    <section
      className="overflow-hidden rounded-[1.35rem] border border-slate-200/70 bg-white"
      style={{ boxShadow: "var(--card-shadow)" }}
      aria-label="Randevu özeti"
    >
      <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <div
              key={t.label}
              className="flex items-center gap-4 px-5 py-5"
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: "#fff7ed" }}
              >
                <Icon className="h-5 w-5 text-orange-500" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-slate-500">{t.label}</p>
                <p className="mt-0.5 truncate text-2xl font-bold text-slate-900">{t.value}</p>
                <p className="mt-0.5 text-[12px] text-slate-400">{t.sub}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
