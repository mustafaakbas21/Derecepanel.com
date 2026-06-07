"use client";

import { useOptimistic, useTransition } from "react";
import { CheckCircle2, Circle, ListTodo, Swords } from "lucide-react";

import { toggleStudentDailyTask } from "@/lib/student/actions/toggle-daily-task";
import type { StudentDailyTask } from "@/lib/student/dashboard/types";
import { cn } from "@/lib/utils";

type Props = {
  tasks: StudentDailyTask[];
  className?: string;
};

function EmptyTasks() {
  return (
    <div className="rounded-xl border border-dashed border-violet-200 bg-violet-50/30 px-4 py-8 text-center">
      <ListTodo className="mx-auto h-8 w-8 text-violet-300" aria-hidden />
      <p className="mt-3 text-sm font-medium text-slate-700">
        Henüz bugüne ait görev atanmamış
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Koçun program atadığında görevler burada quest listesi gibi görünecek.
      </p>
    </div>
  );
}

export function StudentDailyTasks({ tasks: initialTasks, className }: Props) {
  const [pending, startTransition] = useTransition();
  const [tasks, setOptimistic] = useOptimistic(
    initialTasks,
    (state, update: { id: string; completed: boolean }) =>
      state.map((t) =>
        t.id === update.id ? { ...t, completed: update.completed } : t
      )
  );

  const doneCount = tasks.filter((t) => t.completed).length;
  const total = tasks.length;
  const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  function handleToggle(task: StudentDailyTask) {
    const prev = task.completed;
    const next = !prev;
    startTransition(async () => {
      setOptimistic({ id: task.id, completed: next });
      const result = await toggleStudentDailyTask(task.id, next);
      if (!result.ok) {
        setOptimistic({ id: task.id, completed: prev });
      }
    });
  }

  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm",
        className
      )}
      aria-label="Günün görevleri"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Swords className="h-4 w-4 text-violet-600" aria-hidden />
            Günün Quest&apos;leri
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Tamamladıkça XP barın doluyor
          </p>
        </div>
        {total > 0 ? (
          <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-bold tabular-nums text-violet-800">
            {doneCount}/{total}
          </span>
        ) : null}
      </div>

      {total > 0 ? (
        <>
          <div className="mb-4">
            <div className="mb-1 flex justify-between text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              <span>Günlük ilerleme</span>
              <span>%{progress}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-amber-400 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <ul className="space-y-2">
            {tasks.map((task) => (
              <li key={task.id}>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => handleToggle(task)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition",
                    task.completed
                      ? "border-emerald-100 bg-emerald-50/40"
                      : "border-slate-100 bg-slate-50/60 hover:border-violet-200 hover:bg-violet-50/30"
                  )}
                >
                  {task.completed ? (
                    <CheckCircle2
                      className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                      aria-hidden
                    />
                  ) : (
                    <Circle
                      className="mt-0.5 h-5 w-5 shrink-0 text-slate-300"
                      aria-hidden
                    />
                  )}
                  <span
                    className={cn(
                      "text-sm font-medium text-slate-800",
                      task.completed && "text-slate-400 line-through"
                    )}
                  >
                    {task.title}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <EmptyTasks />
      )}
    </section>
  );
}
