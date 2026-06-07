import { buildKeyStringFromExam } from "@/lib/exams/exam-evaluate";
import { normalizeStudentAnswers } from "@/lib/exams/exam-evaluate";
import {
  getResolvedExamMatrix,
  type ExamMatrixRecord,
} from "@/lib/exams/exam-matrix";
import { repairUtf8Mojibake, resolveTopicDisplay } from "@/lib/exams/matrix-resolve";
import { readJsonArray } from "@/lib/exams/local-storage";
import type { ExamResultRow } from "@/lib/exams/types";
import type { PriorityRow } from "@/lib/analiz/types";
import { loadMergedExams } from "@/lib/exams/exam-storage";
import { getExamLayout } from "@/lib/exams/exam-layout";

type MatrixResultRow = {
  examId: string;
  studentId: string;
  answers: { qNo: number; result: string }[];
};

const K_RESULTS_MATRIX = "derece_exam_results_matrix_v1";

function readMatrixResults(): MatrixResultRow[] {
  return readJsonArray<MatrixResultRow>(K_RESULTS_MATRIX);
}

function buildQuestionMeta(mx: ExamMatrixRecord | null) {
  const map: Record<number, { subjectName: string; topicName: string }> = {};
  if (!mx?.questions) return map;
  mx.questions.forEach((q) => {
    const topicName = repairUtf8Mojibake(
      resolveTopicDisplay(
        q.subjectId,
        String(q.topicId || ""),
        "",
        q.topicName || q.subjectName || "Genel"
      )
    );
    map[q.qNo] = {
      subjectName: repairUtf8Mojibake(q.subjectName || "—"),
      topicName,
    };
  });
  return map;
}

export function computeClassQuestionRates(
  examId: string,
  examResults: ExamResultRow[],
  answerKeyStr: string
): PriorityRow[] {
  const mx = getResolvedExamMatrix(examId);
  const meta = buildQuestionMeta(mx);
  const matrixResults = readMatrixResults().filter(
    (r) => r && String(r.examId) === String(examId)
  );
  const examRows = examResults.filter((r) => String(r.examId) === String(examId));

  const acc: Record<number, { c: number; t: number }> = {};

  const bump = (qNo: number, ok: boolean) => {
    if (!qNo) return;
    if (!acc[qNo]) acc[qNo] = { c: 0, t: 0 };
    acc[qNo].t++;
    if (ok) acc[qNo].c++;
  };

  const key = String(answerKeyStr || "");
  const n = key.length;

  // Öncelik: yüklenen examResults + cevap anahtarı (ESKİ fallback — optik sonuçları)
  if (examRows.length && n > 0) {
    examRows.forEach((r) => {
      const ans = normalizeStudentAnswers(r.answers, n);
      for (let i = 0; i < n; i++) {
        const kc = key.charAt(i)?.trim();
        if (!kc || kc === " ") continue;
        const ac = ans.charAt(i) || "";
        bump(i + 1, !!ac && ac !== " " && ac === kc);
      }
    });
  } else if (matrixResults.length) {
    matrixResults.forEach((res) => {
      (res.answers || []).forEach((a) => {
        if (!a?.qNo) return;
        bump(a.qNo, a.result === "correct");
      });
    });
  }

  return Object.keys(acc).map((k) => {
    const qNo = Number(k);
    const e = acc[qNo]!;
    const rate = e.t ? Math.round((1000 * e.c) / e.t) / 10 : 0;
    const m = meta[qNo] || { subjectName: "—", topicName: `Soru ${qNo}` };
    return {
      qNo,
      subjectName: m.subjectName,
      topicName: m.topicName,
      classCorrectRate: rate,
    };
  });
}

export function buildPriorityList(examId: string, examResults: ExamResultRow[]): PriorityRow[] {
  const keyStr = (() => {
    const ex = loadMergedExams().find((e) => e.id === examId);
    if (!ex) return "";
    const layout = getExamLayout(ex.sinav);
    return buildKeyStringFromExam(ex, layout.n);
  })();
  const rows = computeClassQuestionRates(examId, examResults, keyStr);
  return rows
    .filter((r) => r.classCorrectRate < 50)
    .sort((a, b) => a.classCorrectRate - b.classCorrectRate)
    .slice(0, 120);
}
