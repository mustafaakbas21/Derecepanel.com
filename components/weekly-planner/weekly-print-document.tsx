"use client";

import { GOREV_TIPI_LABELS, formatTaskDetailLine } from "@/lib/weekly-planner/task-labels";
import type { WeeklyTask } from "@/lib/weekly-planner/types";
import type { DayWorkload } from "@/lib/weekly-planner/workload";
import { WEEKLY_PRINT_ROOT_ID } from "@/lib/weekly-planner/weekly-print";
import { formatDayHead, WEEK_DAY_LABELS } from "@/lib/weekly-planner/week-utils";

export type WeeklyPrintDocumentProps = {
  studentName: string;
  studentMeta: string;
  weekRange: string;
  weekMonday: Date;
  tasksByDay: WeeklyTask[][];
  dayWorkloads: DayWorkload[];
  /** Sunucu tarafı HTML üretimi — gizli portal gerekmez */
  forExport?: boolean;
};

function accentClass(accent: WeeklyTask["accent"]): string {
  if (accent === "math") return "accent-math";
  if (accent === "turkish") return "accent-turkish";
  if (accent === "science") return "accent-science";
  return "";
}

export function WeeklyPrintDocument({
  studentName,
  studentMeta,
  weekRange,
  weekMonday,
  tasksByDay,
  dayWorkloads,
  forExport = false,
}: WeeklyPrintDocumentProps & { forExport?: boolean }) {
  const generatedAt = new Date().toLocaleString("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const totalTasks = tasksByDay.reduce((n, d) => n + d.length, 0);

  const flatRows: { day: string; dayHead: string; task: WeeklyTask }[] = [];
  WEEK_DAY_LABELS.forEach((day, i) => {
    const dayHead = formatDayHead(weekMonday, i);
    for (const task of tasksByDay[i] ?? []) {
      flatRows.push({ day, dayHead, task });
    }
  });

  return (
    <div
      id={forExport ? undefined : WEEKLY_PRINT_ROOT_ID}
      className={
        forExport
          ? "wp-print-sheet"
          : "wp-print-sheet pointer-events-none fixed left-0 top-0 z-[2147483000] h-[198mm] w-[285mm] max-w-[285mm] bg-white opacity-[0.02]"
      }
      style={
        forExport
          ? {
              width: "285mm",
              maxWidth: "285mm",
              minHeight: "198mm",
            }
          : undefined
      }
      aria-hidden={forExport ? undefined : true}
    >
      <header className="wp-print-header">
        <h1>Haftalık Çalışma Programı</h1>
        <p>
          <strong>{studentName}</strong>
          {studentMeta ? ` · ${studentMeta}` : ""}
        </p>
        <p className="wp-print-meta">
          {weekRange} · {totalTasks} görev · DerecePanel · {generatedAt}
        </p>
      </header>

      <div className="wp-print-main">
      <table className="wp-print-grid">
        <thead>
          <tr>
            {WEEK_DAY_LABELS.map((day, i) => (
              <th key={day}>
                {day}
                <span className="wp-day-date">{formatDayHead(weekMonday, i)}</span>
                <span className="wp-load">Yük %{dayWorkloads[i]?.percent ?? 0}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {WEEK_DAY_LABELS.map((day, i) => {
              const dayTasks = tasksByDay[i] ?? [];
              return (
                <td key={day}>
                  {dayTasks.length === 0 ? (
                    <p className="wp-print-empty">—</p>
                  ) : (
                    dayTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`wp-print-task ${accentClass(task.accent)}`}
                      >
                        <p className="wp-print-task-title">{task.title}</p>
                        <p className="wp-print-task-meta">
                          {GOREV_TIPI_LABELS[task.taskKind]}
                          {task.meta ? ` · ${formatTaskDetailLine(task)}` : ""}
                        </p>
                      </div>
                    ))
                  )}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
      </div>

      {flatRows.length > 0 ? (
        <div className="wp-print-detail-wrap">
          <p className="wp-print-detail-title">Görev detay listesi</p>
          <table className="wp-print-detail">
            <thead>
              <tr>
                <th style={{ width: "12%" }}>Gün</th>
                <th style={{ width: "28%" }}>Görev</th>
                <th style={{ width: "14%" }}>Tür</th>
                <th style={{ width: "18%" }}>Süre / soru</th>
                <th style={{ width: "28%" }}>Kaynak / not</th>
              </tr>
            </thead>
            <tbody>
              {flatRows.map(({ day, dayHead, task }) => (
                <tr key={task.id}>
                  <td>
                    <strong>{day}</strong>
                    <br />
                    <span className="wp-print-detail-day-sub">{dayHead}</span>
                  </td>
                  <td>{task.title}</td>
                  <td>{GOREV_TIPI_LABELS[task.taskKind]}</td>
                  <td>{formatTaskDetailLine(task)}</td>
                  <td>{task.resource || task.coachNote || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <footer className="wp-print-foot">derecepanel · Otonom Haftalık Program</footer>
    </div>
  );
}
