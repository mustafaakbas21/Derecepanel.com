"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarRange,
  CheckCircle2,
  CircleDashed,
  TrendingUp,
} from "lucide-react";

import { ProgressRing } from "@/components/konu-takip/progress-ring";
import { Button } from "@/components/ui/button";
import {
  completionStatus,
  type HistoryRow,
} from "@/lib/weekly-planner/history-filters";
import { GOREV_TIPI_LABELS } from "@/lib/weekly-planner/task-labels";
import { formatMonthGroupLabel, monthGroupKey } from "@/lib/weekly-planner/week-utils";
import { cn } from "@/lib/utils";

function StatusBadge({ stats }: { stats: HistoryRow["stats"] }) {
  const status = completionStatus(stats);
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
        <CheckCircle2 className="h-3 w-3" />
        Tamamlandı
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
        <TrendingUp className="h-3 w-3" />
        Devam ediyor
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
      <CircleDashed className="h-3 w-3" />
      Başlanmadı
    </span>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-slate-500">
        <span>İlerleme</span>
        <span className="tabular-nums text-slate-700">%{pct}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            pct >= 100 ? "bg-emerald-500" : pct >= 50 ? "bg-orange-500" : "bg-amber-500"
          )}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}

function TaskPreviewChips({ row }: { row: HistoryRow }) {
  const preview = row.program.tasks.filter((t) => t.taskKind !== "etut_mola").slice(0, 3);
  if (!preview.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {preview.map((t) => (
        <span
          key={t.id}
          className="max-w-[140px] truncate rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
          title={t.title}
        >
          {t.title}
        </span>
      ))}
      {row.program.tasks.length > 3 ? (
        <span className="rounded-md bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-400">
          +{row.program.tasks.length - 3}
        </span>
      ) : null}
    </div>
  );
}

export function WeeklyProgramHistoryListRow({ row }: { row: HistoryRow }) {
  const { program, stats } = row;
  const pct = Math.round(stats.ratio * 100);

  return (
    <article className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <ProgressRing ratio={stats.ratio} size={52} stroke={5} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-bold text-slate-900">{program.weekRangeLabel}</p>
            <StatusBadge stats={stats} />
          </div>
          <p className="mt-0.5 text-sm text-slate-600">
            {program.tasks.length} görev · {stats.studyDone}/{stats.studyTotal} çalışma görevi
          </p>
          <ProgressBar pct={pct} />
          <TaskPreviewChips row={row} />
          <p className="mt-2 text-xs text-slate-400">
            Güncellendi{" "}
            {new Date(program.updatedAt).toLocaleDateString("tr-TR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>
      <Button variant="outline" size="sm" className="shrink-0" asChild>
        <Link href={`/ogrenci/haftalik-program?week=${program.weekMondayISO}`}>
          Görüntüle
          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Link>
      </Button>
    </article>
  );
}

export function WeeklyProgramHistoryGridCard({ row }: { row: HistoryRow }) {
  const { program, stats } = row;
  const pct = Math.round(stats.ratio * 100);
  const kinds = [...new Set(program.tasks.map((t) => t.taskKind))].slice(0, 4);

  return (
    <article
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition hover:border-slate-300 hover:shadow-md"
      style={{ boxShadow: "var(--card-shadow-sm)" }}
    >
      <div className="border-b border-slate-100 bg-slate-900 px-4 py-3 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Haftalık program
            </p>
            <p className="mt-0.5 truncate text-sm font-bold">{program.weekRangeLabel}</p>
          </div>
          <ProgressRing ratio={stats.ratio} size={44} stroke={4} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge stats={stats} />
          <span className="text-xs tabular-nums text-slate-500">
            {program.tasks.length} görev
          </span>
        </div>

        <ProgressBar pct={pct} />

        <div className="mt-3 flex flex-wrap gap-1">
          {kinds.map((k) => (
            <span
              key={k}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
            >
              {GOREV_TIPI_LABELS[k]}
            </span>
          ))}
        </div>

        <p className="mt-auto pt-4 text-xs text-slate-400">
          {stats.studyDone}/{stats.studyTotal} tamamlandı
        </p>

        <Button variant="primary" size="sm" className="mt-3 w-full" asChild>
          <Link href={`/ogrenci/haftalik-program?week=${program.weekMondayISO}`}>
            Programı aç
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </article>
  );
}

export function WeeklyProgramHistoryTimeline({ rows }: { rows: HistoryRow[] }) {
  const groups = groupHistoryRowsByMonth(rows);

  return (
    <div className="space-y-8 p-4 sm:p-5">
      {groups.map(([key, groupRows]) => (
        <section key={key}>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
              <CalendarRange className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold capitalize text-slate-900">
                {formatMonthGroupLabel(key)}
              </h3>
              <p className="text-xs text-slate-500">{groupRows.length} hafta</p>
            </div>
          </div>

          <div className="relative space-y-3 border-l-2 border-slate-200 pl-6 ml-4">
            {groupRows.map(({ program, stats }) => {
              const pct = Math.round(stats.ratio * 100);
              return (
                <article
                  key={program.id}
                  className="relative rounded-xl border border-slate-200/80 bg-white p-4"
                  style={{ boxShadow: "var(--card-shadow-sm)" }}
                >
                  <span
                    className="absolute -left-[1.55rem] top-5 h-3 w-3 rounded-full border-2 border-white bg-slate-900"
                    aria-hidden
                  />
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-slate-900">{program.weekRangeLabel}</p>
                        <StatusBadge stats={stats} />
                      </div>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
                        <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                        {program.tasks.length} görev · %{pct} ilerleme
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/ogrenci/haftalik-program?week=${program.weekMondayISO}`}>
                        Aç
                      </Link>
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

export function groupHistoryRowsByMonth(rows: HistoryRow[]): [string, HistoryRow[]][] {
  const map = new Map<string, HistoryRow[]>();
  for (const row of rows) {
    const key = monthGroupKey(row.program.weekMondayISO);
    const list = map.get(key) ?? [];
    list.push(row);
    map.set(key, list);
  }
  return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
}

export function WeeklyProgramHistoryResults({
  rows,
  view,
}: {
  rows: HistoryRow[];
  view: "list" | "grid" | "timeline";
}) {
  if (view === "grid") {
    return (
      <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
        {rows.map((row) => (
          <WeeklyProgramHistoryGridCard key={row.program.id} row={row} />
        ))}
      </div>
    );
  }

  if (view === "timeline") {
    return <WeeklyProgramHistoryTimeline rows={rows} />;
  }

  return (
    <div className="divide-y divide-slate-100">
      {rows.map((row) => (
        <WeeklyProgramHistoryListRow key={row.program.id} row={row} />
      ))}
    </div>
  );
}
