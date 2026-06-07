import { daysFromToday, relativeDayLabel } from "@/lib/exams/global-exam-calendar";
import {
  formatTrDate,
  loadMergedExams,
  todayIso,
} from "@/lib/exams/exam-storage";
import type { GlobalExam, MergedExam } from "@/lib/exams/types";
import {
  latestStudentExamSnapshot,
  readStudentExamResults,
  studentExamResultIds,
} from "@/lib/student/exam-results-scope";

export type StudentExamScope = "all" | "kurumsal" | "global";

export type StudentExamView = MergedExam & {
  daysUntil: number;
  countdownLabel: string;
  studentNet: number | null;
  hasResult: boolean;
  publisher?: string;
  timeLabel: string;
  dateLabel: string;
};

export type StudentExamStats = {
  upcomingTotal: number;
  kurumsalUpcoming: number;
  globalUpcoming: number;
  pastWithResult: number;
  lastNet: number | null;
  nextExam: StudentExamView | null;
};

export type StudentExamTimelineGroup = {
  key: string;
  label: string;
  sub?: string;
  items: StudentExamView[];
};

function resultNetByExamId(studentIds: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of readStudentExamResults(studentIds)) {
    if (typeof row.net !== "number" || !Number.isFinite(row.net)) continue;
    map.set(String(row.examId), Math.round(row.net * 10) / 10);
  }
  return map;
}

function enrichExam(exam: MergedExam, nets: Map<string, number>): StudentExamView {
  const daysUntil = daysFromToday(exam.tarih);
  const net = nets.get(exam.id) ?? null;
  const global = exam as MergedExam & GlobalExam;

  return {
    ...exam,
    daysUntil,
    countdownLabel: relativeDayLabel(daysUntil),
    studentNet: net,
    hasResult: net != null,
    publisher: global.yayinevi,
    timeLabel: exam.saat || "09:00",
    dateLabel: formatTrDate(exam.tarih),
  };
}

export function listStudentUpcomingExams(scope: StudentExamScope = "all"): StudentExamView[] {
  const t0 = todayIso();
  const nets = resultNetByExamId(studentExamResultIds());

  return loadMergedExams()
    .filter((exam) => {
      if (!exam.tarih || String(exam.tarih) < t0) return false;
      if (exam.durum === "tamamlandi") return false;
      if (scope === "kurumsal" && exam.isGlobal) return false;
      if (scope === "global" && !exam.isGlobal) return false;
      return true;
    })
    .sort(
      (a, b) =>
        String(a.tarih).localeCompare(String(b.tarih)) ||
        String(a.saat || "").localeCompare(String(b.saat || ""))
    )
    .map((exam) => enrichExam(exam, nets));
}

export function listStudentPastExams(limit = 8): StudentExamView[] {
  const t0 = todayIso();
  const nets = resultNetByExamId(studentExamResultIds());

  return loadMergedExams()
    .filter((exam) => exam.tarih && String(exam.tarih) < t0)
    .sort(
      (a, b) =>
        String(b.tarih).localeCompare(String(a.tarih)) ||
        String(b.saat || "").localeCompare(String(a.saat || ""))
    )
    .slice(0, limit)
    .map((exam) => enrichExam(exam, nets));
}

export function computeStudentExamStats(): StudentExamStats {
  const upcoming = listStudentUpcomingExams("all");
  const past = listStudentPastExams(50);
  const last = latestStudentExamSnapshot();

  return {
    upcomingTotal: upcoming.length,
    kurumsalUpcoming: upcoming.filter((e) => !e.isGlobal).length,
    globalUpcoming: upcoming.filter((e) => e.isGlobal).length,
    pastWithResult: past.filter((e) => e.hasResult).length,
    lastNet: last?.net ?? null,
    nextExam: upcoming[0] ?? null,
  };
}

export function groupUpcomingExams(items: StudentExamView[]): StudentExamTimelineGroup[] {
  if (!items.length) return [];

  const near: StudentExamView[] = [];
  const month: StudentExamView[] = [];
  const later: StudentExamView[] = [];

  for (const item of items) {
    if (item.daysUntil <= 7) near.push(item);
    else if (item.daysUntil <= 30) month.push(item);
    else later.push(item);
  }

  const groups: StudentExamTimelineGroup[] = [];
  if (near.length) {
    groups.push({
      key: "near",
      label: "Yaklaşan",
      sub: "7 gün içinde",
      items: near,
    });
  }
  if (month.length) {
    groups.push({
      key: "month",
      label: "Bu ay",
      sub: "8–30 gün arası",
      items: month,
    });
  }
  if (later.length) {
    groups.push({
      key: "later",
      label: "İleride",
      sub: "30 günden sonra",
      items: later,
    });
  }
  return groups;
}

export function filterStudentExams(
  items: StudentExamView[],
  options: {
    scope: StudentExamScope;
    sinav: "all" | "TYT" | "AYT" | "YDT";
    search: string;
  }
): StudentExamView[] {
  const q = options.search.trim().toLowerCase();

  return items.filter((exam) => {
    if (options.scope === "kurumsal" && exam.isGlobal) return false;
    if (options.scope === "global" && !exam.isGlobal) return false;
    if (options.sinav !== "all" && exam.sinav !== options.sinav) return false;
    if (!q) return true;
    const haystack = [
      exam.name,
      exam.ad,
      exam.sinav,
      exam.isGlobal ? "global" : "kurumsal",
      exam.publisher ?? "",
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}
