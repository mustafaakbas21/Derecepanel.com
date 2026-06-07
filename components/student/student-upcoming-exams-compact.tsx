"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarClock, FileText } from "lucide-react";

import { onExamsChange } from "@/lib/exams/events";
import { formatTrDate, loadUpcomingExams } from "@/lib/exams/storage/exam-storage";
import type { MergedExam } from "@/lib/exams/types";
import { STUDENT_DENEME_ROUTES } from "@/lib/student/sidebar-nav-config";
import { cn } from "@/lib/utils";

const MAX_ITEMS = 5;

const SINAV_STYLE: Record<string, string> = {
  TYT: "bg-blue-50 text-blue-700",
  AYT: "bg-violet-50 text-violet-700",
  YDT: "bg-emerald-50 text-emerald-700",
};

function readUpcoming(): MergedExam[] {
  if (typeof window === "undefined") return [];
  return loadUpcomingExams(MAX_ITEMS);
}

function daysUntil(tarih: string): number | null {
  const t = Date.parse(`${tarih}T00:00:00`);
  if (Number.isNaN(t)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((t - today.getTime()) / 86400000);
}

function countdownLabel(tarih: string): string {
  const d = daysUntil(tarih);
  if (d == null) return "";
  if (d <= 0) return "Bugün";
  if (d === 1) return "Yarın";
  return `${d} gün sonra`;
}

export function StudentUpcomingExamsCompact() {
  const [items, setItems] = useState<MergedExam[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setItems(readUpcoming());
      setHydrated(true);
    };
    refresh();
    return onExamsChange(refresh);
  }, []);

  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-[1.35rem] bg-white p-6"
      style={{ boxShadow: "var(--card-shadow)" }}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-xl font-bold text-slate-900">Yaklaşan Denemelerim</h3>
          <p className="mt-0.5 text-[14px] text-slate-400" suppressHydrationWarning>
            {hydrated
              ? items.length > 0
                ? `${items.length} planlanmış deneme`
                : "Planlanmış deneme yok"
              : "Yükleniyor…"}
          </p>
        </div>
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: "#fff7ed" }}
        >
          <CalendarClock className="h-5 w-5 text-orange-500" strokeWidth={2} />
        </div>
      </div>

      {hydrated && items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-10 text-center">
          <p className="text-[15px] font-semibold text-slate-700">Yaklaşan deneme yok</p>
          <p className="mt-1 text-[13px] text-slate-400">
            Kurum veya global takvime eklenen denemeler burada görünür.
          </p>
        </div>
      ) : (
        <ul className="flex flex-1 flex-col gap-1">
          {items.map((ex) => (
            <li
              key={ex.id}
              className="flex items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-slate-50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-50">
                <FileText className="h-4 w-4 text-orange-500" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold text-slate-800">
                  {ex.name || ex.ad || "Deneme"}
                </p>
                <p className="mt-0.5 flex items-center gap-2 text-[13px] text-slate-400">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold",
                      SINAV_STYLE[ex.sinav] ?? "bg-slate-100 text-slate-600"
                    )}
                  >
                    {ex.sinav}
                  </span>
                  <span>{ex.isGlobal ? "Global" : "Kurumsal"}</span>
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[13px] font-semibold text-slate-700">{formatTrDate(ex.tarih)}</p>
                <p className="text-[12px] text-orange-600">{countdownLabel(ex.tarih)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Link
        href={STUDENT_DENEME_ROUTES.kurumsal}
        className="mt-4 text-[13px] font-semibold text-slate-700 transition hover:text-slate-900"
      >
        Denemelere git →
      </Link>
    </div>
  );
}
