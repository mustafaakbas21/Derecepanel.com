import { EXAM_MATRIX_KEY } from "@/lib/exams/constants";
import { dispatchExamMatrixChange } from "@/lib/exams/events";
import { getExamLayout } from "@/lib/exams/exam-layout";
import { readJsonArray, writeJson } from "@/lib/exams/local-storage";
import { findExamById, loadMergedExams } from "@/lib/exams/exam-storage";
import { panelGetItem, panelRemoveItem, panelSetItem } from "@/lib/panel-store";
import {
  buildMatrixFromExam,
  mergeExamMatrixWithPool,
} from "@/lib/exams/matrix-resolve";
import type { KurumDeneme, MergedExam } from "@/lib/exams/types";

const K_MATRIX = EXAM_MATRIX_KEY;
const K_RESULTS = "derece_exam_results_matrix_v1";

export type MatrixQuestion = {
  qNo: number;
  subjectId: string;
  subjectName: string;
  topicId?: string | null;
  topicName?: string | null;
};

export type ExamMatrixRecord = {
  examId: string;
  name: string;
  date?: string;
  subjectName?: string;
  questionCount: number;
  questions: MatrixQuestion[];
  updatedAt?: string;
};

export type MatrixAnswerItem = {
  qNo: number;
  result: "correct" | "wrong" | "empty";
};

export type MatrixExamResult = {
  examId: string;
  studentId: string;
  studentName?: string;
  date?: string;
  answers: MatrixAnswerItem[];
};

function readAllMatrix(): Record<string, ExamMatrixRecord> {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(panelGetItem(K_MATRIX) || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeAllMatrix(obj: Record<string, ExamMatrixRecord>) {
  if (typeof window === "undefined") return;
  panelSetItem(K_MATRIX, JSON.stringify(obj));
}

function readAllMatrixResults(): MatrixExamResult[] {
  return readJsonArray<MatrixExamResult>(K_RESULTS);
}

function writeAllMatrixResults(list: MatrixExamResult[]) {
  writeJson(K_RESULTS, list);
}

export function saveMatrix(matrix: ExamMatrixRecord): ExamMatrixRecord {
  const all = readAllMatrix();
  matrix.updatedAt = new Date().toISOString();
  matrix.questionCount = matrix.questions.length;
  matrix.questions = (matrix.questions || []).map((q) => ({
    qNo: Number(q.qNo),
    subjectId: String(q.subjectId || ""),
    subjectName: String(q.subjectName || ""),
    topicId: q.topicId ? String(q.topicId) : null,
    topicName: q.topicName ? String(q.topicName) : null,
  }));
  all[matrix.examId] = matrix;
  writeAllMatrix(all);
  dispatchExamMatrixChange(matrix.examId);
  return matrix;
}

export function getMatrix(examId: string): ExamMatrixRecord | null {
  return readAllMatrix()[examId] ?? null;
}

/**
 * Takvimdeki konu matrisi + LS kaydı birleşik — analiz / karne için tek kaynak.
 * Kurumsal/global ayrı havuzdan gelen deneme kaydının konu[] / konuYazi[] alanları kullanılır.
 */
export function getResolvedExamMatrix(examId: string): ExamMatrixRecord | null {
  const exam = findExamById(examId);
  if (!exam) return getMatrix(examId);

  const fromPool = buildMatrixFromExam(exam);
  const stored = getMatrix(examId);

  if (!fromPool?.questions?.length) {
    return stored?.questions?.length ? stored : null;
  }
  if (!stored?.questions?.length) {
    return fromPool;
  }
  /** Takvim (pool) öncelikli — koç matris düzenlemesi anında yansır */
  return mergeExamMatrixWithPool(fromPool, stored) ?? fromPool;
}

/** Deneme kaydedildiğinde veya sonuç yüklendiğinde matrisi güncelle */
export function syncMatrixFromExam(exam: KurumDeneme | MergedExam): ExamMatrixRecord {
  const built = buildMatrixFromExam(exam);
  const stored = getMatrix(exam.id);
  const merged = mergeExamMatrixWithPool(built, stored) ?? built;
  return saveMatrix(merged);
}

/** Kurum deneme konu matrisinden ExamMatrix üret (geriye uyumluluk) */
export function ensureMatrixFromExam(exam: KurumDeneme | MergedExam): ExamMatrixRecord {
  return syncMatrixFromExam(exam);
}

/** Mevcut takvimdeki tüm denemelerin konu matrisini LS ile senkronlar (bir kerelik onarım). */
export function syncAllExamMatricesFromCalendar() {
  if (typeof window === "undefined") return;
  loadMergedExams().forEach((exam) => {
    const hasKonu =
      (exam.konu || []).some((k) => String(k || "").trim()) ||
      (exam.konuYazi || []).some((k) => String(k || "").trim());
    if (!hasKonu) return;
    try {
      syncMatrixFromExam(exam);
    } catch {
      /* ignore */
    }
  });
}

export function addMatrixResult(params: {
  examId: string;
  studentId: string;
  studentName?: string;
  date?: string;
  studentAnswers: string;
  answerKey: string | null;
}): MatrixExamResult {
  const { examId, studentId, studentAnswers, answerKey } = params;
  const key = answerKey || "";
  const N = key.length;
  const ans = String(studentAnswers || "")
    .toUpperCase()
    .replace(/[^A-E]/g, "")
    .padEnd(N, " ");
  const answers: MatrixAnswerItem[] = [];

  for (let q = 0; q < N; q++) {
    const sAns = ans.charAt(q);
    const kAns = key.charAt(q);
    let result: MatrixAnswerItem["result"] = "empty";
    if (!sAns || sAns === " ") result = "empty";
    else if (sAns === kAns) result = "correct";
    else result = "wrong";
    answers.push({ qNo: q + 1, result });
  }

  const rec: MatrixExamResult = {
    examId,
    studentId,
    studentName: params.studentName,
    date: params.date || new Date().toISOString().slice(0, 10),
    answers,
  };

  const list = readAllMatrixResults();
  const idx = list.findIndex((r) => r.examId === examId && r.studentId === studentId);
  if (idx >= 0) list[idx] = rec;
  else list.push(rec);
  writeAllMatrixResults(list);
  return rec;
}
