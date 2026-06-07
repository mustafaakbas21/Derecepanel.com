import type { WeeklyPrintDocumentProps } from "@/components/weekly-planner/weekly-print-document";
import type { StudentRecord } from "@/lib/students/types";
import { FIELD_LABELS } from "@/lib/students/constants";
import { normalizeStudyField } from "@/lib/students/normalize-field";
import type { WeeklyTask } from "@/lib/weekly-planner/types";
import { computeDayWorkloads } from "@/lib/weekly-planner/workload";
import { formatWeekRangeTurkish, WEEK_DAY_LABELS } from "@/lib/weekly-planner/week-utils";

export function buildWeeklyPrintSnapshot(
  student: Pick<StudentRecord, "name" | "sinifBranch" | "alan" | "goal">,
  weekMonday: Date,
  tasks: WeeklyTask[]
): WeeklyPrintDocumentProps {
  const tasksByDay = WEEK_DAY_LABELS.map((_, i) => tasks.filter((t) => t.dayIndex === i));
  return {
    studentName: student.name,
    studentMeta: [
      student.sinifBranch,
      FIELD_LABELS[normalizeStudyField(student.alan)],
      student.goal,
    ]
      .filter(Boolean)
      .join(" · "),
    weekRange: formatWeekRangeTurkish(weekMonday),
    weekMonday,
    tasksByDay,
    dayWorkloads: computeDayWorkloads(tasks),
  };
}
