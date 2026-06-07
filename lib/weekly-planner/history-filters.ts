import type { StudentWeeklyInboxItem } from "@/lib/weekly-planner/saved-programs";
import { panelGetItem, panelRemoveItem, panelSetItem } from "@/lib/panel-store";
import {
  computeProgramCompletion,
  type ProgramProgressRecord,
} from "@/lib/weekly-planner/student-progress";
import { mondayOf, toISODate, weekOverlapsDateRange } from "@/lib/weekly-planner/week-utils";

export type CompletionFilter = "all" | "completed" | "in_progress" | "not_started";
export type PeriodPreset = "all" | "4w" | "3m" | "6m" | "year" | "custom";
export type SortKey = "newest" | "oldest" | "most_done" | "least_done" | "most_tasks";
export type ViewMode = "list" | "grid" | "timeline";
export type MinProgressFilter = "all" | "25" | "50" | "75" | "100";

export type HistoryRow = {
  program: StudentWeeklyInboxItem;
  stats: ReturnType<typeof computeProgramCompletion>;
};

export type HistoryFilterState = {
  query: string;
  completion: CompletionFilter;
  period: PeriodPreset;
  dateFrom: string;
  dateTo: string;
  sort: SortKey;
  minProgress: MinProgressFilter;
  view: ViewMode;
};

export const HISTORY_FILTER_PREFS_KEY = "derecepanel_student_wp_history_filters_v1";

export const DEFAULT_HISTORY_FILTERS: HistoryFilterState = {
  query: "",
  completion: "all",
  period: "all",
  dateFrom: "",
  dateTo: "",
  sort: "newest",
  minProgress: "all",
  view: "list",
};

export function buildHistoryRow(
  program: StudentWeeklyInboxItem,
  progress: Pick<ProgramProgressRecord, "completedTaskIds">
): HistoryRow {
  return {
    program,
    stats: computeProgramCompletion(program.tasks, progress.completedTaskIds),
  };
}

export function completionStatus(stats: HistoryRow["stats"]): CompletionFilter {
  if (stats.studyTotal === 0) return "not_started";
  if (stats.ratio >= 1) return "completed";
  if (stats.ratio > 0) return "in_progress";
  return "not_started";
}

function matchesPeriodPreset(weekMondayISO: string, period: PeriodPreset, now = new Date()): boolean {
  if (period === "all" || period === "custom") return true;
  const weekStart = new Date(`${weekMondayISO}T12:00:00`);
  if (Number.isNaN(weekStart.getTime())) return true;

  const cutoff = new Date(now);
  if (period === "4w") cutoff.setDate(cutoff.getDate() - 28);
  else if (period === "3m") cutoff.setMonth(cutoff.getMonth() - 3);
  else if (period === "6m") cutoff.setMonth(cutoff.getMonth() - 6);
  else if (period === "year") cutoff.setMonth(0, 1);

  cutoff.setHours(0, 0, 0, 0);
  return weekStart >= cutoff;
}

export function programSearchHaystack(program: StudentWeeklyInboxItem): string {
  const bits = [
    program.weekRangeLabel,
    program.title,
    program.studentName,
    ...program.tasks.map((t) =>
      [t.title, t.meta, t.topicName, t.subjectName, t.resource].filter(Boolean).join(" ")
    ),
  ];
  return bits.join(" ").toLocaleLowerCase("tr-TR");
}

export function filterHistoryRows(rows: HistoryRow[], filters: HistoryFilterState): HistoryRow[] {
  const q = filters.query.trim().toLocaleLowerCase("tr-TR");
  const minPct =
    filters.minProgress === "all" ? 0 : Number.parseInt(filters.minProgress, 10) / 100;

  let out = rows.filter(({ program, stats }) => {
    if (q && !programSearchHaystack(program).includes(q)) return false;
    if (filters.completion !== "all" && completionStatus(stats) !== filters.completion) {
      return false;
    }
    const useDateRange =
      filters.period === "custom" || Boolean(filters.dateFrom) || Boolean(filters.dateTo);
    if (useDateRange) {
      if (!weekOverlapsDateRange(program.weekMondayISO, filters.dateFrom, filters.dateTo)) {
        return false;
      }
    } else if (!matchesPeriodPreset(program.weekMondayISO, filters.period)) {
      return false;
    }
    if (minPct > 0 && stats.ratio * 100 < minPct) return false;
    return true;
  });

  out = [...out].sort((a, b) => {
    switch (filters.sort) {
      case "oldest":
        return (
          new Date(a.program.weekMondayISO).getTime() -
          new Date(b.program.weekMondayISO).getTime()
        );
      case "most_done":
        return b.stats.ratio - a.stats.ratio;
      case "least_done":
        return a.stats.ratio - b.stats.ratio;
      case "most_tasks":
        return b.program.tasks.length - a.program.tasks.length;
      default:
        return (
          new Date(b.program.weekMondayISO).getTime() -
          new Date(a.program.weekMondayISO).getTime()
        );
    }
  });

  return out;
}

export function countByCompletion(rows: HistoryRow[]) {
  const counts = { all: rows.length, completed: 0, in_progress: 0, not_started: 0 };
  for (const row of rows) {
    const s = completionStatus(row.stats);
    if (s === "completed") counts.completed += 1;
    else if (s === "in_progress") counts.in_progress += 1;
    else counts.not_started += 1;
  }
  return counts;
}

export function summarizeHistoryRows(rows: HistoryRow[]) {
  const totalWeeks = rows.length;
  const completedWeeks = rows.filter((r) => r.stats.ratio >= 1 && r.stats.studyTotal > 0).length;
  const avgPct =
    totalWeeks > 0
      ? Math.round((rows.reduce((acc, r) => acc + r.stats.ratio, 0) / totalWeeks) * 100)
      : 0;
  const totalTasks = rows.reduce((acc, r) => acc + r.program.tasks.length, 0);
  const doneTasks = rows.reduce((acc, r) => acc + r.stats.studyDone, 0);
  return { totalWeeks, completedWeeks, avgPct, totalTasks, doneTasks };
}

export function summarizeFilteredRows(filtered: HistoryRow[], all: HistoryRow[]) {
  const base = summarizeHistoryRows(filtered);
  return { ...base, totalAvailable: all.length };
}

export function isHistoryFiltersActive(
  filters: HistoryFilterState,
  defaults: HistoryFilterState = DEFAULT_HISTORY_FILTERS
): boolean {
  return (
    filters.query.trim().length > 0 ||
    filters.completion !== defaults.completion ||
    filters.period !== defaults.period ||
    Boolean(filters.dateFrom) ||
    Boolean(filters.dateTo) ||
    filters.sort !== defaults.sort ||
    filters.minProgress !== defaults.minProgress
  );
}

export type FilterChip = {
  id: string;
  label: string;
};

export function activeFilterChips(filters: HistoryFilterState): FilterChip[] {
  const chips: FilterChip[] = [];
  if (filters.query.trim()) {
    chips.push({ id: "query", label: `Arama: “${filters.query.trim()}”` });
  }
  if (filters.completion !== "all") {
    const labels: Record<CompletionFilter, string> = {
      all: "",
      completed: "Tamamlanan",
      in_progress: "Devam eden",
      not_started: "Başlanmamış",
    };
    chips.push({ id: "completion", label: `Durum: ${labels[filters.completion]}` });
  }
  if (filters.period !== "all" && filters.period !== "custom") {
    const labels: Record<PeriodPreset, string> = {
      all: "",
      "4w": "Son 4 hafta",
      "3m": "Son 3 ay",
      "6m": "Son 6 ay",
      year: "Bu yıl",
      custom: "",
    };
    chips.push({ id: "period", label: `Dönem: ${labels[filters.period]}` });
  }
  if (filters.dateFrom || filters.dateTo) {
    const fmt = (iso: string) =>
      iso
        ? new Date(`${iso}T12:00:00`).toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "…";
    chips.push({
      id: "dates",
      label: `Tarih: ${fmt(filters.dateFrom)} – ${fmt(filters.dateTo)}`,
    });
  }
  if (filters.minProgress !== "all") {
    chips.push({ id: "minProgress", label: `Min. ilerleme: %${filters.minProgress}` });
  }
  if (filters.sort !== "newest") {
    const labels: Record<SortKey, string> = {
      newest: "",
      oldest: "En eski",
      most_done: "En yüksek ilerleme",
      least_done: "En düşük ilerleme",
      most_tasks: "En çok görev",
    };
    chips.push({ id: "sort", label: `Sıra: ${labels[filters.sort]}` });
  }
  return chips;
}

export function clearFilterChip(
  filters: HistoryFilterState,
  chipId: string
): HistoryFilterState {
  switch (chipId) {
    case "query":
      return { ...filters, query: "" };
    case "completion":
      return { ...filters, completion: "all" };
    case "period":
      return { ...filters, period: "all" };
    case "dates":
      return { ...filters, period: "all", dateFrom: "", dateTo: "" };
    case "minProgress":
      return { ...filters, minProgress: "all" };
    case "sort":
      return { ...filters, sort: "newest" };
    default:
      return filters;
  }
}

export function filtersFromSearchParams(params: URLSearchParams): HistoryFilterState {
  const period = (params.get("period") as PeriodPreset | null) ?? DEFAULT_HISTORY_FILTERS.period;
  return {
    query: params.get("q") ?? "",
    completion: (params.get("status") as CompletionFilter | null) ?? "all",
    period: ["all", "4w", "3m", "6m", "year", "custom"].includes(period) ? period : "all",
    dateFrom: params.get("from") ?? "",
    dateTo: params.get("to") ?? "",
    sort: (params.get("sort") as SortKey | null) ?? "newest",
    minProgress: (params.get("min") as MinProgressFilter | null) ?? "all",
    view: (params.get("view") as ViewMode | null) ?? "list",
  };
}

export function filtersToSearchParams(filters: HistoryFilterState): URLSearchParams {
  const p = new URLSearchParams();
  if (filters.query.trim()) p.set("q", filters.query.trim());
  if (filters.completion !== "all") p.set("status", filters.completion);
  if (filters.period !== "all") p.set("period", filters.period);
  if (filters.dateFrom) p.set("from", filters.dateFrom);
  if (filters.dateTo) p.set("to", filters.dateTo);
  if (filters.sort !== "newest") p.set("sort", filters.sort);
  if (filters.minProgress !== "all") p.set("min", filters.minProgress);
  if (filters.view !== "list") p.set("view", filters.view);
  return p;
}

export function loadHistoryFilterPrefs(): Partial<HistoryFilterState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = panelGetItem(HISTORY_FILTER_PREFS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<HistoryFilterState>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveHistoryFilterPrefs(filters: HistoryFilterState) {
  if (typeof window === "undefined") return;
  try {
    const { view, sort, period, minProgress } = filters;
    panelSetItem(
      HISTORY_FILTER_PREFS_KEY,
      JSON.stringify({ view, sort, period, minProgress })
    );
  } catch {
    /* quota */
  }
}

export function suggestedDateRangeForPeriod(period: PeriodPreset): {
  dateFrom: string;
  dateTo: string;
} {
  const now = new Date();
  const to = toISODate(now);
  if (period === "all") return { dateFrom: "", dateTo: "" };
  const fromDate = new Date(now);
  if (period === "4w") fromDate.setDate(fromDate.getDate() - 28);
  else if (period === "3m") fromDate.setMonth(fromDate.getMonth() - 3);
  else if (period === "6m") fromDate.setMonth(fromDate.getMonth() - 6);
  else if (period === "year") fromDate.setMonth(0, 1);
  else return { dateFrom: "", dateTo: "" };
  return { dateFrom: toISODate(fromDate), dateTo: to };
}

export function defaultCustomRange(): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const from = mondayOf(now);
  from.setMonth(from.getMonth() - 3);
  return { dateFrom: toISODate(from), dateTo: toISODate(now) };
}
