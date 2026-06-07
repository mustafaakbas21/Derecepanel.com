import { catalogIdForUser } from "@/lib/appointments/catalog";
import { getCurrentUser } from "@/lib/appointments/current-user";
import { matchIdsForUser } from "@/lib/appointments/student-scope";
import { resolveStudentTrackingId } from "@/lib/konu-takip/student-scope";
import { readMergedResultsForStudent } from "@/lib/exams/exam-results-storage";
import { loadMergedExams } from "@/lib/exams/storage/exam-storage";
import type { ExamResultRow } from "@/lib/exams/types";

const TR_MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

export type NetTrendPoint = {
  key: string;
  month: string;
  net: number;
  examName?: string;
  dateISO: string;
};

export function studentExamResultIds(): string[] {
  const user = getCurrentUser();
  if (!user) return [];
  const ids = new Set(matchIdsForUser(user));
  const tracking = resolveStudentTrackingId(user);
  if (tracking) ids.add(tracking);
  if (user.ogrenciId) ids.add(user.ogrenciId);
  if (user.studentCode) ids.add(user.studentCode);
  return [...ids].filter(Boolean);
}

export function readStudentExamResults(studentIds = studentExamResultIds()): ExamResultRow[] {
  if (!studentIds.length) return [];
  return readMergedResultsForStudent(studentIds);
}

function chartLabelFromISO(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  const day = d.getDate();
  const mon = TR_MONTHS[d.getMonth()] ?? "";
  return `${mon} ${day}`;
}

export function buildStudentNetTrendPoints(
  studentIds = studentExamResultIds(),
  limit = 10
): NetTrendPoint[] {
  if (!studentIds.length) return [];

  const examDates = new Map(loadMergedExams().map((e) => [e.id, e.tarih]));

  const byExam = new Map<string, { net: number; sortKey: string; examName?: string }>();

  for (const row of readMergedResultsForStudent(studentIds)) {
    if (typeof row.net !== "number" || !Number.isFinite(row.net)) continue;
    const sortKey = examDates.get(row.examId) || row.savedAt?.slice(0, 10) || "";
    if (!sortKey) continue;
    byExam.set(String(row.examId), {
      net: Math.round(row.net * 10) / 10,
      sortKey,
      examName: row.examName,
    });
  }

  return [...byExam.entries()]
    .sort((a, b) => a[1].sortKey.localeCompare(b[1].sortKey))
    .slice(-limit)
    .map(([examId, item], index) => ({
      key: `${examId}-${index}`,
      month: chartLabelFromISO(item.sortKey),
      net: item.net,
      examName: item.examName,
      dateISO: item.sortKey,
    }));
}

export function latestStudentExamNet(studentIds = studentExamResultIds()): number | null {
  const snap = latestStudentExamSnapshot(studentIds);
  return snap?.net ?? null;
}

export type LatestExamSnapshot = {
  net: number;
  examName: string;
  sinav: string;
  dateISO: string;
};

export function latestStudentExamSnapshot(
  studentIds = studentExamResultIds()
): LatestExamSnapshot | null {
  if (!studentIds.length) return null;

  const examMeta = new Map(
    loadMergedExams().map((e) => [
      e.id,
      { tarih: e.tarih, name: e.name || e.ad || "Deneme", sinav: e.sinav || "TYT" },
    ])
  );

  let best: LatestExamSnapshot | null = null;

  for (const row of readMergedResultsForStudent(studentIds)) {
    if (typeof row.net !== "number" || !Number.isFinite(row.net)) continue;
    const meta = examMeta.get(row.examId);
    const dateISO = meta?.tarih || row.savedAt?.slice(0, 10) || "";
    if (!dateISO) continue;

    const candidate: LatestExamSnapshot = {
      net: Math.round(row.net * 10) / 10,
      examName: row.examName || meta?.name || "Deneme",
      sinav: meta?.sinav || "TYT",
      dateISO,
    };

    if (!best || candidate.dateISO >= best.dateISO) best = candidate;
  }

  return best;
}
