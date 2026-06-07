import { buildClassRatesMap } from "@/lib/analiz/error-karne";
import { computeStudentQuestionResults } from "@/lib/analiz/question-results";
import { readAnalizExamResults } from "@/lib/analiz/exam-results-source";
import { findExamById } from "@/lib/exams/exam-storage";
import { getResolvedExamMatrix } from "@/lib/exams/exam-matrix";
import { repairUtf8Mojibake, resolveTopicDisplay } from "@/lib/exams/matrix-resolve";
import { readJsonArray } from "@/lib/exams/local-storage";

export type TopicQuestionDetail = {
  qNo: number;
  result: "correct" | "wrong" | "empty";
  examId: string;
  examName: string;
  classRate: number;
};

type MatrixResultRow = {
  examId: string;
  studentId: string;
  answers: { qNo: number; result: string }[];
};

function topicKey(subjectName: string, topicName: string) {
  return `${subjectName}|${topicName}`;
}

/** Öğrencinin tüm sınavlarından konu → soru listesi */
export function collectStudentCrossQuestions(
  studentId: string
): Record<string, TopicQuestionDetail[]> {
  const sid = String(studentId);
  const byTopic: Record<string, TopicQuestionDetail[]> = {};

  const push = (detail: TopicQuestionDetail, subjectName: string, topicName: string) => {
    const key = topicKey(subjectName, topicName);
    if (!byTopic[key]) byTopic[key] = [];
    const dup = byTopic[key].some(
      (x) => x.examId === detail.examId && x.qNo === detail.qNo
    );
    if (!dup) byTopic[key].push(detail);
  };

  const matrixRows = readJsonArray<MatrixResultRow>("derece_exam_results_matrix_v1").filter(
    (r) => r && String(r.studentId) === sid
  );

  matrixRows.forEach((res) => {
    const examId = String(res.examId);
    const exam = findExamById(examId);
    const examName = exam?.name || exam?.ad || examId;
    const classRates = buildClassRatesMap(examId);
    const mx = getResolvedExamMatrix(examId);
    if (!mx) return;

    (res.answers || []).forEach((a) => {
      if (!a?.qNo) return;
      const q = mx.questions.find((x) => x.qNo === a.qNo);
      const subjectName = repairUtf8Mojibake(q?.subjectName || "—");
      const topicName = q
        ? repairUtf8Mojibake(
            resolveTopicDisplay(
              q.subjectId,
              String(q.topicId || ""),
              "",
              q.topicName || q.subjectName
            )
          )
        : `Soru ${a.qNo}`;
      const result =
        a.result === "correct" || a.result === "wrong" || a.result === "empty"
          ? a.result
          : "empty";
      push(
        {
          qNo: a.qNo,
          result,
          examId,
          examName,
          classRate: classRates[a.qNo] ?? 0,
        },
        subjectName,
        topicName
      );
    });
  });

  const examIds = new Set<string>();
  readAnalizExamResults()
    .filter((r) => String(r.studentId) === sid || String(r.studentCode) === sid)
    .forEach((r) => examIds.add(String(r.examId)));

  examIds.forEach((examId) => {
    const exam = findExamById(examId);
    const examName = exam?.name || exam?.ad || examId;
    const classRates = buildClassRatesMap(examId);
    const cells = computeStudentQuestionResults(examId, sid);
    cells.forEach((c) => {
      push(
        {
          qNo: c.qNo,
          result: c.result,
          examId,
          examName,
          classRate: classRates[c.qNo] ?? 0,
        },
        c.subjectName,
        c.topicName
      );
    });
  });

  Object.values(byTopic).forEach((list) =>
    list.sort((a, b) => {
      if (a.examName !== b.examName) return a.examName.localeCompare(b.examName, "tr");
      return a.qNo - b.qNo;
    })
  );

  return byTopic;
}

export function questionsForTopic(
  byTopic: Record<string, TopicQuestionDetail[]>,
  subjectName: string,
  topicName: string
): TopicQuestionDetail[] {
  return byTopic[topicKey(subjectName, topicName)] ?? [];
}
