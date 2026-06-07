import {
  EXAM_PACKAGES_KEY,
  EXAM_RESULTS_KEY,
  MAX_PACKAGES,
  MAX_STUDENT_ARCHIVE,
} from "@/lib/exams/constants";
import { dispatchExamResultsChange } from "@/lib/exams/events";
import { readJsonArray, writeJson } from "@/lib/exams/storage/local-storage";
import type { ExamResultPackage, ExamResultRow, ParseRow } from "@/lib/exams/types";
import {
  buildCoachStudentAllowSet,
  rowMatchesCoachAllow,
  shouldFilterByCoach,
} from "@/lib/exams/coach-scope";
import { loadCatalogStudents } from "@/lib/exams/student-catalog-bridge";

export function readExamResults(): ExamResultRow[] {
  return readJsonArray<ExamResultRow>(EXAM_RESULTS_KEY);
}

export function writeExamResults(rows: ExamResultRow[]) {
  writeJson(EXAM_RESULTS_KEY, rows);
}

export function readExamPackages(): ExamResultPackage[] {
  return readJsonArray<ExamResultPackage>(EXAM_PACKAGES_KEY);
}

function coachFilterResults(rows: ExamResultRow[]): ExamResultRow[] {
  if (!shouldFilterByCoach()) return rows;
  const catalog = loadCatalogStudents();
  const allow = buildCoachStudentAllowSet(catalog);
  if (!allow) return rows;
  return rows.filter((r) => rowMatchesCoachAllow(r, allow));
}

export function readCoachScopedExamResults(): ExamResultRow[] {
  return coachFilterResults(readExamResults());
}

export function resultsForExam(examId: string, scoped = true): ExamResultRow[] {
  const want = String(examId);
  const pool = scoped ? readCoachScopedExamResults() : readExamResults();
  return pool.filter((r) => r && String(r.examId) === want);
}

export function readStudentArchive(studentId: string): ExamResultRow[] {
  return readJsonArray<ExamResultRow>(`examResults_${studentId}`);
}

export interface SaveExamResultsOptions {
  examId: string;
  examName: string;
  fileName: string;
  templateLabel: string;
  templateId: string;
  updateExisting: boolean;
  rows: ParseRow[];
}

export function saveExamResultsBatch(opts: SaveExamResultsOptions): number {
  const {
    examId,
    examName,
    fileName,
    templateLabel,
    templateId,
    updateExisting,
    rows,
  } = opts;

  const selectedClean = rows.filter((r) => r.matched && r.matchedId);
  if (!selectedClean.length) return 0;

  const pkg: ExamResultPackage = {
    id: `pkg-${Date.now().toString(36)}`,
    savedAt: new Date().toISOString(),
    source: fileName,
    parser: templateLabel,
    template: templateId,
    examId,
    examName,
    count: selectedClean.length,
    updateExisting,
    items: selectedClean.map((r) => ({
      rowId: r.id,
      studentCode: r.no,
      studentName: r.name,
      studentId: r.matchedId,
      book: r.book,
      answers: r.answers,
      net: r.net,
      sube: r.sube,
      matched: r.matched,
      examId,
    })),
  };

  const packages = readExamPackages();
  packages.unshift(pkg);
  if (packages.length > MAX_PACKAGES) packages.length = MAX_PACKAGES;
  writeJson(EXAM_PACKAGES_KEY, packages);

  const canon = readExamResults();
  const now = new Date().toISOString();

  selectedClean.forEach((r) => {
    const sid = r.matchedId || r.no;
    if (!sid) return;
    const rec: ExamResultRow = {
      examId,
      examName,
      studentId: sid,
      studentCode: r.no,
      name: r.name,
      studentName: r.name,
      book: r.book,
      answers: r.answers,
      net: r.net,
      correct: r.correct,
      wrong: r.wrong,
      blank: r.blank,
      sube: r.sube,
      source: fileName,
      savedAt: now,
    };
    const idx = canon.findIndex(
      (c) => c && c.examId === examId && c.studentId === sid
    );
    if (updateExisting && idx >= 0) canon[idx] = rec;
    else if (idx >= 0) canon[idx] = rec;
    else canon.push(rec);

    const key = `examResults_${sid}`;
    const list = readJsonArray<ExamResultRow>(key);
    const li = list.findIndex((x) => x && x.examId === examId);
    if (updateExisting && li >= 0) list[li] = rec;
    else if (li >= 0) list[li] = rec;
    else list.push(rec);
    list.sort((a, b) => String(a.savedAt || "").localeCompare(String(b.savedAt || "")));
    const trimmed = list.length > MAX_STUDENT_ARCHIVE ? list.slice(-MAX_STUDENT_ARCHIVE) : list;
    writeJson(key, trimmed);
  });

  writeExamResults(canon);
  dispatchExamResultsChange(examId);
  return selectedClean.length;
}

export function readMergedResultsForStudent(studentIds: string[]): ExamResultRow[] {
  const byKey: Record<string, ExamResultRow> = {};
  const add = (rec: ExamResultRow) => {
    if (!rec?.examId) return;
    const k = String(rec.examId);
    const prev = byKey[k];
    if (!prev || String(rec.savedAt || "") >= String(prev.savedAt || "")) byKey[k] = rec;
  };
  studentIds.forEach((id) => readStudentArchive(id).forEach(add));
  readExamResults().forEach((rec) => {
    const sid = String(rec.studentId || "");
    const scode = String(rec.studentCode || "");
    if (studentIds.some((id) => id === sid || (scode && id === scode))) add(rec);
  });
  return Object.values(byKey).sort((a, b) =>
    String(b.savedAt || "").localeCompare(String(a.savedAt || ""))
  );
}

export function computeKpiStats(
  results: ExamResultRow[],
  examCount: number,
  examsWithResults?: number
) {
  const uniqueExamIds = new Set(results.map((r) => r.examId).filter(Boolean));
  const nets = results.map((r) => r.net).filter((n): n is number => typeof n === "number");
  const avgNet = nets.length
    ? Math.round((nets.reduce((a, b) => a + b, 0) / nets.length) * 10) / 10
    : null;
  return {
    examCount,
    participationRecords: results.length,
    participationExamIds: uniqueExamIds.size,
    examsWithResults: examsWithResults ?? uniqueExamIds.size,
    avgNet,
  };
}
