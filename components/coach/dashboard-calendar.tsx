"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { clientMonthView, clientNow } from "@/lib/coach/client-now";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"] as const;

const MONTHS = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
] as const;

function startWeekdayMonday(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function buildMonthGrid(year: number, month: number) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = startWeekdayMonday(year, month);
  const cells: (number | null)[] = [];

  for (let i = 0; i < leading; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function isSameDay(a: Date, y: number, m: number, d: number) {
  return a.getFullYear() === y && a.getMonth() === m && a.getDate() === d;
}

export function DashboardCalendar({ className }: { className?: string }) {
  const [today] = useState(clientNow);
  const [view, setView] = useState(clientMonthView);

  const cells = useMemo(() => buildMonthGrid(view.year, view.month), [view.year, view.month]);

  const todayShort = today.toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const todayCompact = today.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    weekday: "short",
  });

  const goMonth = (delta: number) => {
    const d = new Date(view.year, view.month + delta, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
  };

  const isCurrentMonth =
    view.year === today.getFullYear() && view.month === today.getMonth();

  return (
    <section
      className={cn(
        "flex w-full flex-col rounded-2xl border border-slate-200/70 bg-slate-100 p-5 sm:p-6",
        className
      )}
      style={{ boxShadow: "0 2px 20px -6px rgba(15, 23, 42, 0.08)" }}
      aria-label="Takvim"
    >
      <div className="mb-5 flex items-start gap-4">
        <div className="min-w-0 flex-1 rounded-xl border border-slate-200/80 bg-white px-4 py-3.5 sm:px-5 sm:py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Bugün
          </p>
          <p
            className="mt-1 text-lg font-bold capitalize leading-snug text-slate-900 sm:text-xl"
            suppressHydrationWarning
          >
            <span className="sm:hidden">{todayCompact}</span>
            <span className="hidden sm:inline">{todayShort}</span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => goMonth(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
            aria-label="Önceki ay"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="w-[7rem] shrink-0 truncate text-center text-[15px] font-bold text-slate-800 sm:text-base">
            {MONTHS[view.month]} {view.year}
          </p>
          <button
            type="button"
            onClick={() => goMonth(1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
            aria-label="Sonraki ay"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!isCurrentMonth && (
        <button
          type="button"
          onClick={() => setView(clientMonthView(today))}
          className="mb-4 w-full rounded-xl border border-slate-200/80 bg-white py-2 text-[12px] font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
        >
          Bugüne dön
        </button>
      )}

      <div className="rounded-xl border border-slate-200/80 bg-white p-3 sm:p-4">
        <div className="mb-1 grid grid-cols-7 gap-1">
          {WEEKDAYS.map((d) => (
            <span
              key={d}
              className="py-1 text-center text-[10px] font-bold uppercase tracking-wide text-slate-400 sm:text-[11px]"
            >
              {d}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) {
              return <span key={`e-${i}`} className="aspect-square" />;
            }
            const isToday = isSameDay(today, view.year, view.month, day);
            const dow = new Date(view.year, view.month, day).getDay();
            const isWeekend = (dow === 0 || dow === 6) && !isToday;

            return (
              <span
                key={`${view.year}-${view.month}-${day}`}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-lg text-[13px] font-semibold transition sm:text-sm",
                  isToday
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                    : isWeekend
                      ? "bg-slate-50 text-slate-500"
                      : "text-slate-700 hover:bg-slate-50"
                )}
              >
                {day}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
