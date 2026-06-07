"use client";

import { CheckCircle2, Circle, Clock } from "lucide-react";

import { GOREV_TIPI_LABELS, formatTaskDetailLine } from "@/lib/weekly-planner/task-labels";
import type { WeeklyTask } from "@/lib/weekly-planner/types";
import { cn } from "@/lib/utils";

const ACCENT_BORDER: Record<WeeklyTask["accent"], string> = {
  math: "border-l-orange-500",
  turkish: "border-l-emerald-500",
  science: "border-l-sky-500",
  default: "border-l-slate-400",
};

const TASK_KIND_TONE: Record<WeeklyTask["taskKind"], string> = {
  konu_calisma: "bg-violet-100 text-violet-800",
  soru_cozme: "bg-sky-100 text-sky-800",
  deneme_cozme: "bg-rose-100 text-rose-800",
  etut_mola: "bg-slate-100 text-slate-600",
  tekrar: "bg-amber-100 text-amber-800",
  video: "bg-slate-100 text-slate-700",
};

type Props = {
  task: WeeklyTask;
  done: boolean;
  onToggle: () => void;
  compact?: boolean;
};

export function StudentWeeklyTaskCard({ task, done, onToggle, compact = false }: Props) {
  const isBreak = task.taskKind === "etut_mola";
  const accent = task.accent && ACCENT_BORDER[task.accent] ? task.accent : "default";

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-xl border border-slate-200/80 border-l-4 bg-white transition",
        ACCENT_BORDER[accent],
        compact ? "p-3" : "p-4",
        done && !isBreak && "opacity-80",
        isBreak && "border-l-slate-300 bg-slate-50/80"
      )}
      style={{ boxShadow: "var(--card-shadow-sm)" }}
    >
      <div className="flex gap-3">
        {!isBreak ? (
          <button
            type="button"
            onClick={onToggle}
            className={cn(
              "mt-0.5 shrink-0 rounded-full transition",
              done ? "text-emerald-600" : "text-slate-300 hover:text-slate-500"
            )}
            aria-label={done ? "Tamamlandı işaretini kaldır" : "Tamamlandı işaretle"}
          >
            {done ? (
              <CheckCircle2 className={compact ? "h-5 w-5" : "h-6 w-6"} />
            ) : (
              <Circle className={compact ? "h-5 w-5" : "h-6 w-6"} />
            )}
          </button>
        ) : (
          <div
            className={cn(
              "mt-0.5 flex shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-500",
              compact ? "h-5 w-5" : "h-6 w-6"
            )}
          >
            <Clock className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                TASK_KIND_TONE[task.taskKind] ?? TASK_KIND_TONE.konu_calisma
              )}
            >
              {GOREV_TIPI_LABELS[task.taskKind] ?? task.taskKind}
            </span>
            {done && !isBreak ? (
              <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                Tamamlandı
              </span>
            ) : null}
          </div>
          <p
            className={cn(
              "mt-1.5 font-semibold leading-snug text-slate-900",
              compact ? "text-sm" : "text-sm",
              done && !isBreak && "line-through decoration-slate-400"
            )}
          >
            {task.title}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">{formatTaskDetailLine(task)}</p>
          {!compact && task.topicName ? (
            <p className="mt-1 text-xs font-medium text-slate-600">{task.topicName}</p>
          ) : null}
          {!compact && task.coachNote ? (
            <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-2 text-xs leading-relaxed text-amber-950">
              <span className="font-semibold">Koç notu:</span> {task.coachNote}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
