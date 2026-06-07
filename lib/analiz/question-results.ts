import { getAnswerKeyForExamId } from "@/lib/analiz/hydrate";
import { getResolvedExamMatrix } from "@/lib/exams/exam-matrix";
import { normalizeStudentAnswers } from "@/lib/exams/exam-evaluate";
import { repairUtf8Mojibake, resolveTopicDisplay } from "@/lib/exams/matrix-resolve";
import { readJsonArray } from "@/lib/exams/local-storage";
import { readAnalizExamResults } from "@/lib/analiz/exam-results-source";

export type QuestionOutcome = "correct" | "wrong" | "empty";

export type StudentQuestionResult = {
  qNo: number;
  result: QuestionOutcome;
  subjectName: string;
  topicName: string;
  subjectId?: string;
  topicId?: string;
};

type MatrixResultRow = {
  examId: string;
  studentId: string;
  answers: { qNo: number; result: string }[];
};

function topicLabel(q: {
  subjectId: string;
  subjectName: string;
  topicId?: string | null;
  topicName?: string | null;
}): string {
  return repairUtf8Mojibake(
    resolveTopicDisplay(
      q.subjectId,
      String(q.topicId || ""),
      "",
      q.topicName || q.subjectName || "Genel"
    )
  );
}

function findStudentRow(examId: string, studentId: string) {
  const sid = String(studentId);
  return readAnalizExamResults().find(
    (r) =>
      String(r.examId) === String(examId) &&
      (String(r.studentId) === sid || String(r.studentCode) === sid)
  );
}

/**
 * Tek öğrenci — soru bazlı D/Y/B (ESKİ computeStudentQuestionResults).
 * Öncelik: examResults + cevap anahtarı; yoksa derece_exam_results_matrix_v1.
 */
export function computeStudentQuestionResults(
  examId: string,
  studentId: string,
  answerKeyStr?: string
): StudentQuestionResult[] {
  const eid = String(examId);
  const sid = String(studentId);
  const mx = getResolvedExamMatrix(eid);
  const key = String(answerKeyStr ?? getAnswerKeyForExamId(eid) ?? "");
  const n = key.length;

  const meta = (qNo: number) => {
    const q = mx?.questions.find((x) => x.qNo === qNo);
    return {
      subjectName: repairUtf8Mojibake(q?.subjectName || "—"),
      topicName: q ? topicLabel(q) : `Soru ${qNo}`,
      subjectId: q?.subjectId ? String(q.subjectId) : undefined,
      topicId: q?.topicId ? String(q.topicId) : undefined,
    };
  };

  const row = findStudentRow(eid, sid);
  if (row && n > 0) {
    const ans = normalizeStudentAnswers(row.answers, n);
    const out: StudentQuestionResult[] = [];
    for (let i = 0; i < n; i++) {
      const kc = key.charAt(i)?.trim();
      if (!kc || kc === " ") continue;
      const ac = ans.charAt(i) || "";
      let result: QuestionOutcome = "empty";
      if (ac && ac !== " ") result = ac === kc ? "correct" : "wrong";
      out.push({ qNo: i + 1, result, ...meta(i + 1) });
    }
    return out;
  }

  const matrixRow = readJsonArray<MatrixResultRow>("derece_exam_results_matrix_v1").find(
    (r) => r && String(r.examId) === eid && String(r.studentId) === sid
  );
  if (!matrixRow?.answers?.length) return [];

  return matrixRow.answers
    .filter((a) => a?.qNo)
    .map((a) => {
      const res =
        a.result === "correct" || a.result === "wrong" || a.result === "empty"
          ? a.result
          : "empty";
      return {
        qNo: a.qNo,
        result: res as QuestionOutcome,
        ...meta(a.qNo),
      };
    });
}
