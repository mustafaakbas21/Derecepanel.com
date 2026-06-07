"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  History,
  Sparkles,
  Target,
} from "lucide-react";

import { ProgressRing } from "@/components/konu-takip/progress-ring";
import {
  LIBRARY_PAGE_CLASS,
  LIBRARY_PANEL_CLASS,
  LibraryPageHeader,
} from "@/components/library/library-shell";
import { StudentWeeklyTaskCard } from "@/components/student/student-weekly-task-card";
import { Button } from "@/components/ui/button";
import { STUDENT_HAFTALIK_PROGRAM_ROUTES } from "@/lib/student/sidebar-nav-config";
import type { WeeklyTask } from "@/lib/weekly-planner/types";
import { useStudentPersonalWeeklyProgram } from "@/lib/weekly-planner/use-student-personal-weekly-program";
import { useStudentWeeklyProgram } from "@/lib/weekly-planner/use-student-weekly-program";
import { computeDayWorkloads } from "@/lib/weekly-planner/workload";
import {
  formatDayHead,
  mondayOf,
  todayDayIndex,
  WEEK_DAY_LABELS,
  WEEK_DAY_SHORT,
} from "@/lib/weekly-planner/week-utils";
import { cn } from "@/lib/utils";

function MetricTile({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "accent" | "success";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        tone === "accent" && "border-orange-200/80 bg-orange-50/50",
        tone === "success" && "border-emerald-200/80 bg-emerald-50/50",
        tone === "default" && "border-slate-200/80 bg-white"
      )}
      style={tone === "default" ? { boxShadow: "var(--card-shadow-sm)" } : undefined}
    >
      <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{value}</p>
      {sub ? <p className="mt-1 text-[12px] text-slate-500">{sub}</p> : null}
    </div>
  );
}

type ProgramView = "coach" | "self";

function ProgramSourceTabs({
  view,
  onChange,
}: {
  view: ProgramView;
  onChange: (view: ProgramView) => void;
}) {
  return (
    <div
      className="inline-flex w-full max-w-xl gap-1 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm sm:w-auto"
      role="tablist"
      aria-label="Program kaynağı"
    >
      <button
        type="button"
        role="tab"
        aria-selected={view === "coach"}
        onClick={() => onChange("coach")}
        className={cn(
          "flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition sm:flex-none",
          view === "coach"
            ? "bg-slate-900 text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-50"
        )}
      >
        Hocamın attığı program
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={view === "self"}
        onClick={() => onChange("self")}
        className={cn(
          "flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition sm:flex-none",
          view === "self"
            ? "bg-slate-900 text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-50"
        )}
      >
        Benim oluşturduğum
      </button>
    </div>
  );
}

export function StudentWeeklyProgramPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const weekParam = searchParams.get("week") ?? undefined;
  const viewParam = searchParams.get("view");
  const view: ProgramView = viewParam === "self" ? "self" : "coach";

  const coachData = useStudentWeeklyProgram(weekParam);
  const personalData = useStudentPersonalWeeklyProgram(weekParam);

  const {
    user,
    hydrated,
    coachName,
    targetWeek,
    isCurrentWeek,
  } = coachData;

  const active =
    view === "coach"
      ? {
          program: coachData.program,
          progress: coachData.progress,
          completedIds: coachData.completedIds,
          toggleTask: coachData.toggleTask,
        }
      : {
          program: personalData.program,
          progress: personalData.progress,
          completedIds: personalData.completedIds,
          toggleTask: personalData.toggleTask,
        };

  const { program, progress, completedIds, toggleTask } = active;

  const setView = (next: ProgramView) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "self") params.set("view", "self");
    else params.delete("view");
    const qs = params.toString();
    router.replace(qs ? `/ogrenci/haftalik-program?${qs}` : "/ogrenci/haftalik-program", {
      scroll: false,
    });
  };

  const [selectedDay, setSelectedDay] = useState(todayDayIndex());

  useEffect(() => {
    if (hydrated && !user) router.replace("/");
  }, [hydrated, user, router]);

  useEffect(() => {
    if (isCurrentWeek) setSelectedDay(todayDayIndex());
  }, [isCurrentWeek, program?.id]);

  const weekMonday = useMemo(() => mondayOf(new Date(`${targetWeek}T12:00:00`)), [targetWeek]);
  const workloads = useMemo(() => computeDayWorkloads(program?.tasks ?? []), [program?.tasks]);

  const tasksByDay = useMemo(() => {
    const buckets: WeeklyTask[][] = [[], [], [], [], [], [], []];
    for (const t of program?.tasks ?? []) {
      if (t.dayIndex >= 0 && t.dayIndex <= 6) buckets[t.dayIndex]!.push(t);
    }
    return buckets;
  }, [program?.tasks]);

  const todayTasks = tasksByDay[selectedDay] ?? [];
  const todayDone = todayTasks.filter(
    (t) => t.taskKind !== "etut_mola" && completedIds.has(t.id)
  ).length;
  const todayStudyCount = todayTasks.filter((t) => t.taskKind !== "etut_mola").length;

  if (!hydrated) {
    return <p className="text-sm text-slate-500">Yükleniyor…</p>;
  }

  if (!user) {
    return (
      <p className="text-sm text-slate-500">
        Oturum bulunamadı.{" "}
        <Link href="/" className="font-medium text-slate-900 underline">
          Giriş sayfasına dön
        </Link>
      </p>
    );
  }

  return (
    <div className={LIBRARY_PAGE_CLASS}>
      <LibraryPageHeader
        title={isCurrentWeek ? "Bu Haftaki Program" : "Haftalık Program"}
        description={
          view === "coach"
            ? `${coachName} tarafından hazırlanan çalışma planınız. Koç kaydettiğinde program anında burada görünür.`
            : "Kendi oluşturduğunuz bireysel haftalık program. Bireysel planlayıcıdan kaydettiğinizde burada görünür."
        }
        meta={
          program
            ? `${program.tasks.length} görev · ${program.weekRangeLabel}`
            : isCurrentWeek
              ? view === "coach"
                ? "Bu hafta için koç programı henüz atanmadı"
                : "Bu hafta için bireysel program henüz oluşturulmadı"
              : "Program bulunamadı"
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            {view === "self" ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={STUDENT_HAFTALIK_PROGRAM_ROUTES.bireysel}>
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Planlayıcıyı aç
                </Link>
              </Button>
            ) : null}
            <Button variant="outline" size="sm" asChild>
              <Link href="/ogrenci/haftalik-program/gecmis">
                <History className="mr-2 h-4 w-4" />
                Geçmiş programlar
              </Link>
            </Button>
          </div>
        }
      />

      {isCurrentWeek ? (
        <ProgramSourceTabs view={view} onChange={setView} />
      ) : null}

      {!program ? (
        <div
          className={cn(LIBRARY_PANEL_CLASS, "flex flex-col items-center px-6 py-16 text-center")}
        >
          <div
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: "#fff7ed" }}
          >
            <CalendarDays className="h-8 w-8 text-orange-500" strokeWidth={2} />
          </div>
          <p className="text-xl font-bold text-slate-900">
            {isCurrentWeek
              ? view === "coach"
                ? "Bu hafta için koç programı yok"
                : "Bu hafta için bireysel program yok"
              : "Program bulunamadı"}
          </p>
          <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-slate-500">
            {isCurrentWeek
              ? view === "coach"
                ? `${coachName} haftalık programınızı oluşturup kaydettiğinde burada anında görünür.`
                : "Bireysel haftalık program oluşturucudan program kaydettiğinizde burada görünür."
              : "Seçilen hafta için kayıtlı program bulunamadı."}
          </p>
          {isCurrentWeek && view === "self" ? (
            <Button variant="primary" className="mt-6" asChild>
              <Link href={STUDENT_HAFTALIK_PROGRAM_ROUTES.bireysel}>Program oluştur</Link>
            </Button>
          ) : null}
          {!isCurrentWeek ? (
            <Button variant="primary" className="mt-6" asChild>
              <Link href="/ogrenci/haftalik-program">Bu haftaya dön</Link>
            </Button>
          ) : null}
        </div>
      ) : (
        <>
          {/* Hero */}
          <section
            className="overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white"
            style={{ boxShadow: "var(--card-shadow)" }}
          >
            <div className="border-b border-slate-100 bg-slate-900 px-6 py-5 text-white">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    {isCurrentWeek ? "Bu hafta" : "Geçmiş hafta"}
                  </p>
                  <h2 className="mt-1 text-2xl font-bold">{program.weekRangeLabel}</h2>
                  <p className="mt-1 text-sm text-slate-300">
                    {view === "coach" ? (
                      <>
                        Hazırlayan:{" "}
                        <span className="font-semibold text-white">{coachName}</span>
                      </>
                    ) : (
                      <>
                        Kaynak:{" "}
                        <span className="font-semibold text-white">Bireysel programım</span>
                      </>
                    )}
                  </p>
                </div>
                <ProgressRing ratio={progress.ratio} size={72} stroke={6} variant="onDark" />
              </div>
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
              <MetricTile
                label="Tamamlanan"
                value={`${progress.studyDone}/${progress.studyTotal}`}
                sub="Etüt/mola hariç görevler"
                tone={progress.ratio >= 1 ? "success" : "accent"}
              />
              <MetricTile
                label="Bugün"
                value={todayStudyCount > 0 ? `${todayDone}/${todayStudyCount}` : "—"}
                sub={
                  isCurrentWeek
                    ? `${WEEK_DAY_LABELS[selectedDay]} görevleri`
                    : WEEK_DAY_LABELS[selectedDay]
                }
              />
              <MetricTile
                label="Toplam görev"
                value={String(program.tasks.length)}
                sub={`${program.tasks.filter((t) => t.taskKind === "etut_mola").length} mola/etüt`}
              />
              <MetricTile
                label="İlerleme"
                value={`%${Math.round(progress.ratio * 100)}`}
                sub={
                  progress.ratio >= 1
                    ? "Harika — haftayı tamamladın!"
                    : progress.studyTotal > 0
                      ? `${progress.studyTotal - progress.studyDone} görev kaldı`
                      : "Görev yok"
                }
                tone={progress.ratio >= 1 ? "success" : "default"}
              />
            </div>

            {"updatedAt" in program && program.updatedAt ? (
              <div className="flex items-center gap-2 border-t border-slate-100 px-6 py-3 text-xs text-slate-500">
                <Sparkles className="h-3.5 w-3.5 text-orange-500" />
                Son güncelleme:{" "}
                {new Date(program.updatedAt).toLocaleString("tr-TR", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </div>
            ) : null}
          </section>

          {/* Gün sekmeleri */}
          <section className={cn(LIBRARY_PANEL_CLASS, "overflow-hidden")}>
            <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {WEEK_DAY_LABELS.map((label, i) => {
                  const isToday = isCurrentWeek && i === todayDayIndex();
                  const active = selectedDay === i;
                  const count = tasksByDay[i]?.length ?? 0;
                  const wl = workloads[i]!;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setSelectedDay(i)}
                      className={cn(
                        "flex min-w-[5.5rem] shrink-0 flex-col items-center rounded-xl border px-3 py-2.5 text-center transition",
                        active
                          ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                        isToday && !active && "ring-2 ring-orange-200"
                      )}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wide opacity-80">
                        {WEEK_DAY_SHORT[i]}
                      </span>
                      <span className="mt-0.5 text-sm font-bold">{formatDayHead(weekMonday, i).split(" ")[1]}</span>
                      <span
                        className={cn(
                          "mt-1 text-[10px] font-semibold",
                          active ? "text-slate-300" : "text-slate-400"
                        )}
                      >
                        {count ? `${count} görev` : "Boş"}
                      </span>
                      {wl.level !== "safe" && count > 0 ? (
                        <span
                          className={cn(
                            "mt-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase",
                            active
                              ? "bg-white/15 text-white"
                              : wl.level === "danger"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-amber-100 text-amber-700"
                          )}
                        >
                          {wl.level === "danger" ? "Yoğun" : "Dolu"}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {WEEK_DAY_LABELS[selectedDay]}
                  </h3>
                  <p className="text-sm text-slate-500">{formatDayHead(weekMonday, selectedDay)}</p>
                </div>
                {isCurrentWeek && selectedDay === todayDayIndex() ? (
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-800">
                    Bugün
                  </span>
                ) : null}
              </div>

              {todayTasks.length === 0 ? (
                <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-12 text-center">
                  <Target className="mb-3 h-8 w-8 text-slate-300" />
                  <p className="font-medium text-slate-700">Bu gün için görev yok</p>
                  <p className="mt-1 text-sm text-slate-500">Dinlenme veya telafi günü olabilir.</p>
                </div>
              ) : (
                todayTasks.map((task) => (
                  <StudentWeeklyTaskCard
                    key={task.id}
                    task={task}
                    done={completedIds.has(task.id)}
                    onToggle={() => toggleTask(task.id)}
                  />
                ))
              )}
            </div>
          </section>

          {/* Haftalık özet */}
          <section className={cn(LIBRARY_PANEL_CLASS, "overflow-hidden")}>
            <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
              <h3 className="text-lg font-bold text-slate-900">Haftalık özet</h3>
              <p className="mt-0.5 text-sm text-slate-500">Tüm günlerin görev dağılımı</p>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:p-5">
              {WEEK_DAY_LABELS.map((label, i) => {
                const dayTasks = tasksByDay[i] ?? [];
                const study = dayTasks.filter((t) => t.taskKind !== "etut_mola");
                const done = study.filter((t) => completedIds.has(t.id)).length;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setSelectedDay(i)}
                    className={cn(
                      "rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-left transition hover:border-slate-300 hover:bg-white",
                      selectedDay === i && "border-slate-900/20 ring-1 ring-slate-900/10"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">{label}</p>
                      <BookOpen className="h-4 w-4 text-slate-400" />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {study.length ? `${done}/${study.length} tamamlandı` : "Görev yok"}
                    </p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200/80">
                      <div
                        className="h-full rounded-full bg-slate-900 transition-all"
                        style={{
                          width: `${study.length ? Math.round((done / study.length) * 100) : 0}%`,
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
