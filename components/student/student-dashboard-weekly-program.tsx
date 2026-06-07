"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Sparkles } from "lucide-react";

import { ProgressRing } from "@/components/konu-takip/progress-ring";
import { StudentWeeklyTaskCard } from "@/components/student/student-weekly-task-card";
import { Button } from "@/components/ui/button";
import { useStudentPersonalWeeklyProgram } from "@/lib/weekly-planner/use-student-personal-weekly-program";
import { useStudentWeeklyProgram } from "@/lib/weekly-planner/use-student-weekly-program";
import { computeDayWorkloads } from "@/lib/weekly-planner/workload";
import type { WeeklyTask } from "@/lib/weekly-planner/types";
import {
  formatDayHead,
  mondayOf,
  todayDayIndex,
  WEEK_DAY_LABELS,
  WEEK_DAY_SHORT,
} from "@/lib/weekly-planner/week-utils";
import { STUDENT_HAFTALIK_PROGRAM_ROUTES } from "@/lib/student/sidebar-nav-config";
import { cn } from "@/lib/utils";

export function StudentDashboardWeeklyProgram() {
  const coach = useStudentWeeklyProgram();
  const personal = useStudentPersonalWeeklyProgram();
  const [source, setSource] = useState<"coach" | "self">("coach");
  const [selectedDay, setSelectedDay] = useState(todayDayIndex());

  const activeSource = useMemo(() => {
    if (coach.program && personal.program) return source;
    if (coach.program) return "coach" as const;
    if (personal.program) return "self" as const;
    return source;
  }, [coach.program, personal.program, source]);

  const program = activeSource === "coach" ? coach.program : personal.program;
  const progress = activeSource === "coach" ? coach.progress : personal.progress;
  const completedIds = activeSource === "coach" ? coach.completedIds : personal.completedIds;
  const toggleTask = activeSource === "coach" ? coach.toggleTask : personal.toggleTask;
  const hydrated = coach.hydrated && personal.hydrated;

  const weekMonday = useMemo(
    () => mondayOf(new Date(`${coach.targetWeek}T12:00:00`)),
    [coach.targetWeek]
  );
  const todayIdx = todayDayIndex();

  useEffect(() => {
    setSelectedDay(todayIdx);
  }, [todayIdx, program?.id, activeSource]);

  const workloads = useMemo(() => computeDayWorkloads(program?.tasks ?? []), [program?.tasks]);

  const tasksByDay = useMemo(() => {
    const buckets: WeeklyTask[][] = [[], [], [], [], [], [], []];
    for (const t of program?.tasks ?? []) {
      if (t.dayIndex >= 0 && t.dayIndex <= 6) buckets[t.dayIndex]!.push(t);
    }
    return buckets;
  }, [program?.tasks]);

  const selectedTasks = tasksByDay[selectedDay] ?? [];
  const selectedStudy = selectedTasks.filter((t) => t.taskKind !== "etut_mola");
  const selectedDone = selectedStudy.filter((t) => completedIds.has(t.id)).length;
  const isSelectedToday = selectedDay === todayIdx;

  const programHref =
    activeSource === "self"
      ? `${STUDENT_HAFTALIK_PROGRAM_ROUTES.buHafta}?view=self`
      : STUDENT_HAFTALIK_PROGRAM_ROUTES.buHafta;

  return (
    <div
      className="shrink-0 rounded-[1.35rem] bg-white p-6"
      style={{ boxShadow: "var(--card-shadow)" }}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Bu Haftaki Programım</h3>
          <p className="mt-0.5 text-[14px] text-slate-400" suppressHydrationWarning>
            {hydrated
              ? program
                ? `${program.weekRangeLabel} · ${program.tasks.length} görev`
                : "Bu hafta için program atanmadı"
              : "Yükleniyor…"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {coach.program && personal.program ? (
            <div className="inline-flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setSource("coach")}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                  activeSource === "coach"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-white"
                )}
              >
                Koç
              </button>
              <button
                type="button"
                onClick={() => setSource("self")}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                  activeSource === "self"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-white"
                )}
              >
                Bireysel
              </button>
            </div>
          ) : null}
          <Button variant="outline" size="sm" asChild>
            <Link href={programHref}>Tümünü gör</Link>
          </Button>
        </div>
      </div>

      {!hydrated ? (
        <p className="text-sm text-slate-500">Yükleniyor…</p>
      ) : !program ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-12 text-center">
          <CalendarDays className="mb-3 h-10 w-10 text-orange-400" />
          <p className="text-[15px] font-semibold text-slate-700">Bu hafta program yok</p>
          <p className="mt-1 max-w-md text-[13px] text-slate-400">
            Koçunuz program atadığında veya bireysel planlayıcıdan kaydettiğinizde burada görünür.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button variant="primary" size="sm" asChild>
              <Link href={STUDENT_HAFTALIK_PROGRAM_ROUTES.bireysel}>Program oluştur</Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-5 flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200/80 bg-slate-900 px-5 py-4 text-white">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                {activeSource === "coach" ? "Koç programı" : "Bireysel program"}
              </p>
              <p className="mt-1 text-lg font-bold">
                {WEEK_DAY_LABELS[selectedDay]}
                {isSelectedToday ? " — bugün" : ""}
              </p>
              <p className="mt-0.5 text-sm text-slate-300">
                {selectedStudy.length
                  ? `${selectedDone}/${selectedStudy.length} görev tamamlandı`
                  : "Bu gün için görev yok"}
              </p>
            </div>
            <ProgressRing ratio={progress.ratio} size={64} stroke={5} variant="onDark" />
          </div>

          <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
            {WEEK_DAY_LABELS.map((label, i) => {
              const count = tasksByDay[i]?.length ?? 0;
              const isToday = i === todayIdx;
              const active = selectedDay === i;
              const wl = workloads[i]!;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setSelectedDay(i)}
                  className={cn(
                    "flex min-w-[4.5rem] shrink-0 flex-col items-center rounded-xl border px-2.5 py-2 text-center transition",
                    active
                      ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                    isToday && !active && "ring-2 ring-orange-200"
                  )}
                >
                  <span className="text-[10px] font-bold uppercase opacity-80">{WEEK_DAY_SHORT[i]}</span>
                  <span className="text-xs font-bold">{formatDayHead(weekMonday, i).split(" ")[1]}</span>
                  <span className={cn("mt-0.5 text-[10px]", active ? "text-slate-300" : "text-slate-400")}>
                    {count ? `${count} görev` : "Boş"}
                  </span>
                  {wl.level === "danger" && count > 0 && !active ? (
                    <span className="mt-0.5 text-[9px] font-bold text-rose-600">Yoğun</span>
                  ) : wl.level === "warning" && count > 0 && !active ? (
                    <span className="mt-0.5 text-[9px] font-bold text-amber-600">Dolu</span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">
                  {WEEK_DAY_LABELS[selectedDay]} görevleri
                </h4>
                {isSelectedToday ? (
                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-800">
                    Bugün
                  </span>
                ) : null}
              </div>
              <span className="text-xs text-slate-400">{formatDayHead(weekMonday, selectedDay)}</span>
            </div>
            {selectedTasks.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center text-sm text-slate-500">
                Bu gün için görev yok — dinlenme günü olabilir.
              </p>
            ) : (
              <div className="space-y-2">
                {selectedTasks.map((task) => (
                  <StudentWeeklyTaskCard
                    key={task.id}
                    task={task}
                    done={completedIds.has(task.id)}
                    onToggle={() => toggleTask(task.id)}
                    compact
                  />
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase text-slate-500">Tamamlanan</p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {progress.studyDone}/{progress.studyTotal}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase text-slate-500">Toplam görev</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{program.tasks.length}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase text-slate-500">İlerleme</p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                %{Math.round(progress.ratio * 100)}
              </p>
            </div>
          </div>

          {program.updatedAt ? (
            <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
              <Sparkles className="h-3.5 w-3.5 text-orange-500" />
              Son güncelleme:{" "}
              {new Date(program.updatedAt).toLocaleString("tr-TR", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
