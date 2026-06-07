"use client";

import { memo, useEffect, useMemo, useState } from "react";

import { DashboardCalendar } from "@/components/coach/dashboard-calendar";
import { clientNow } from "@/lib/coach/client-now";
import {
  formatCountdownUnit,
  formatRemainingLabel,
  getCountdownParts,
  yksCountdownConfig,
} from "@/lib/coach/yks-countdown";
import { cn } from "@/lib/utils";

const UNITS = [
  { key: "days", label: "GÜN" },
  { key: "hours", label: "SAAT" },
  { key: "minutes", label: "DAKİKA" },
  { key: "seconds", label: "SANİYE" },
] as const;

function CountdownBox({
  value,
  label,
  digits = 2,
}: {
  value: string;
  label: string;
  digits?: 2 | 3;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-white px-2 py-4 sm:py-5 lg:py-6">
      <span
        className={cn(
          "inline-block text-center font-bold leading-none tabular-nums tracking-tight text-slate-900",
          "text-[1.75rem] sm:text-[2rem] lg:text-[2.125rem]",
          digits === 3 ? "min-w-[3.25rem]" : "min-w-[2.75rem]"
        )}
        aria-live="off"
        aria-atomic="true"
        suppressHydrationWarning
      >
        {value}
      </span>
      <span className="mt-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </span>
    </div>
  );
}

const CountdownDigits = memo(function CountdownDigits({ targetDate }: { targetDate: Date }) {
  const [now, setNow] = useState(clientNow);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const parts = getCountdownParts(targetDate, now);
  const values = {
    days:
      parts.days >= 100 ? String(parts.days) : formatCountdownUnit(parts.days),
    hours: formatCountdownUnit(parts.hours),
    minutes: formatCountdownUnit(parts.minutes),
    seconds: formatCountdownUnit(parts.seconds),
  };

  return (
    <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
      {UNITS.map(({ key, label }) => (
        <CountdownBox
          key={key}
          value={values[key]}
          label={label}
          digits={key === "days" ? 3 : 2}
        />
      ))}
    </div>
  );
});

const SessionRemaining = memo(function SessionRemaining({
  targetDate,
  fallback,
}: {
  targetDate: Date;
  fallback: string;
}) {
  const [label, setLabel] = useState(() => formatRemainingLabel(targetDate, clientNow()));

  useEffect(() => {
    const tick = () => setLabel(formatRemainingLabel(targetDate, new Date()));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [targetDate]);

  return <>{label || fallback}</>;
});

function SessionCard({
  type,
  status,
  statusTone,
  date,
  dayTime,
  targetDate,
  remainingFallback,
}: {
  type: "TYT" | "AYT";
  status: string;
  statusTone: "success" | "muted";
  date: string;
  dayTime: string;
  targetDate: Date;
  remainingFallback: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
          {type}
        </span>
        <span
          className={cn(
            "text-[10px] font-semibold",
            statusTone === "success" ? "text-emerald-600" : "text-slate-400"
          )}
        >
          {status}
        </span>
      </div>
      <p className="mt-2.5 text-[15px] font-bold leading-snug text-slate-900 sm:text-base">{date}</p>
      <p className="mt-0.5 text-[13px] text-slate-400">{dayTime}</p>
      <div className="my-3 border-t border-dashed border-slate-200" aria-hidden />
      <p
        className="min-h-[1.35rem] truncate text-[14px] font-semibold tabular-nums text-slate-600"
        suppressHydrationWarning
      >
        <SessionRemaining targetDate={targetDate} fallback={remainingFallback} />
      </p>
    </div>
  );
}

const YksCountdownPanel = memo(function YksCountdownPanel() {
  const { title, subtitle, targetDate, progressPercent, sessions } = yksCountdownConfig;

  const sessionCards = useMemo(
    () =>
      sessions.map((session) => (
        <SessionCard
          key={session.type}
          type={session.type}
          status={session.status}
          statusTone={session.statusTone}
          date={session.date}
          dayTime={session.dayTime}
          targetDate={session.targetDate}
          remainingFallback={session.remainingLabel}
        />
      )),
    [sessions]
  );

  return (
    <section
      className="flex w-full flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-slate-100 p-5 sm:p-6"
      style={{ boxShadow: "0 2px 20px -6px rgba(15, 23, 42, 0.08)" }}
      aria-label="YKS geri sayım"
    >
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-slate-900 sm:text-xl">{title}</h2>
          <p className="mt-0.5 text-[14px] text-slate-500 sm:text-[15px]">{subtitle}</p>
        </div>
        <div className="w-full shrink-0 sm:w-36 sm:pt-1">
          <p className="mb-1.5 text-right text-[11px] font-medium text-slate-400">
            Sezon ilerlemesi
          </p>
          <div className="flex h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-l-full bg-slate-900 transition-[width] duration-500"
              style={{ width: `${progressPercent}%` }}
            />
            <div className="h-full min-w-[8%] flex-1 rounded-r-full bg-slate-300" />
          </div>
        </div>
      </div>

      <CountdownDigits targetDate={targetDate} />

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">{sessionCards}</div>
    </section>
  );
});

/** Üst hero: sol/orta YKS sayaç, sağda sabit genişlikte takvim */
export function YksCountdown() {
  return (
    <div
      className={cn(
        "grid w-full grid-cols-1 items-start gap-4",
        "lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] lg:gap-5",
        "xl:grid-cols-[minmax(0,1fr)_minmax(320px,400px)]"
      )}
    >
      <YksCountdownPanel />
      <DashboardCalendar />
    </div>
  );
}
