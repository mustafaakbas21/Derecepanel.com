import { getAnswerKeyFromExam } from "@/lib/exams/exam-evaluate";
import { addMatrixResult, ensureMatrixFromExam } from "@/lib/exams/exam-matrix";
import { saveExamResultsBatch } from "@/lib/exams/exam-results-storage";
import { findExamById } from "@/lib/exams/exam-storage";
import type { ParseRow } from "@/lib/exams/types";

export function persistImportOnClient(opts: {
  examId: string;
  examName: string;
  fileName: string;
  templateId: string;
  templateLabel: string;
  updateExisting: boolean;
  rows: ParseRow[];
}): number {
  const exam = findExamById(opts.examId);
  if (exam) ensureMatrixFromExam(exam);

  const key = getAnswerKeyFromExam(exam)?.key ?? null;

  opts.rows.forEach((r) => {
    if (!r.matchedId) return;
    addMatrixResult({
      examId: opts.examId,
      studentId: r.matchedId,
      studentName: r.name,
      date: exam?.tarih || exam?.date,
      studentAnswers: r.answers,
      answerKey: key,
    });
  });

  return saveExamResultsBatch({
    examId: opts.examId,
    examName: opts.examName,
    fileName: opts.fileName,
    templateId: opts.templateId,
    templateLabel: opts.templateLabel,
    updateExisting: opts.updateExisting,
    rows: opts.rows,
  });
}
