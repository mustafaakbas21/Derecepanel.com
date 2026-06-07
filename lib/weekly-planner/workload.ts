import type { WeeklyTask } from "@/lib/weekly-planner/types";

export type WorkloadLevel = "safe" | "warning" | "danger";

export type DayWorkload = {
  level: WorkloadLevel;
  percent: number;
  label: string;
  taskCount: number;
};

function taskWeight(t: WeeklyTask): number {
  return t.taskKind === "etut_mola" ? 0.35 : 1;
}

export function computeDayWorkloads(tasks: WeeklyTask[]): DayWorkload[] {
  const weights = [0, 0, 0, 0, 0, 0, 0];
  const counts = [0, 0, 0, 0, 0, 0, 0];

  for (const t of tasks) {
    const i = t.dayIndex;
    if (i < 0 || i > 6) continue;
    weights[i] += taskWeight(t);
    counts[i] += 1;
  }

  return weights.map((w, i) => {
    const taskCount = counts[i];
    let level: WorkloadLevel = "safe";
    if (w >= 5) level = "danger";
    else if (w >= 3) level = "warning";

    const percent = Math.min(100, Math.round((w / 5) * 100));
    let label =
      taskCount === 0
        ? "Boş"
        : taskCount === 1
          ? "1 görev"
          : `${taskCount} görev`;
    if (level === "danger") label = `${taskCount} görev · kritik yük`;

    return { level, percent, label, taskCount };
  });
}
