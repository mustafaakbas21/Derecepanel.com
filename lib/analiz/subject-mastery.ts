import { getResolvedExamMatrix } from "@/lib/exams/exam-matrix";
import { repairUtf8Mojibake, resolveTopicDisplay } from "@/lib/exams/matrix-resolve";
import { readJsonArray } from "@/lib/exams/local-storage";
import { buildStudentSubjectBreakdown } from "@/lib/analiz/student-subject-breakdown";
import { readAnalizExamResults } from "@/lib/analiz/exam-results-source";
import { getAnswerKeyForExamId } from "@/lib/analiz/hydrate";
import { examMatchesSinavScope } from "@/lib/analiz/mastery-scope";
import { findExamById } from "@/lib/exams/exam-storage";
import type { SinavTipi } from "@/lib/exams/types";

type MatrixResultRow = {
  examId: string;
  studentId: string;
  answers: { qNo: number; result: string }[];
};

export type SubjectMasteryRow = {
  subjectName: string;
  topicName: string;
  correct: number;
  wrong: number;
  empty: number;
  total: number;
  rate: number;
  trend: "up" | "down" | "flat";
};

export type SubjectMasteryOptions = {
  /** Seçili denemenin sınav tipi — yalnızca aynı tipteki (TYT/AYT/YDT) denemeler birleştirilir */
  sinav?: SinavTipi | null;
};

export function calculateSubjectMastery(
  studentId: string,
  options?: SubjectMasteryOptions
): SubjectMasteryRow[] {
  const sid = String(studentId);
  const sinav = options?.sinav ?? null;
  const matrixResults = readJsonArray<MatrixResultRow>("derece_exam_results_matrix_v1").filter(
    (r) =>
      r &&
      String(r.studentId) === sid &&
      examMatchesSinavScope(String(r.examId), sinav)
  );

  const acc: Record<
    string,
    {
      correct: number;
      wrong: number;
      empty: number;
      total: number;
      subjectName: string;
      topicName: string;
    }
  > = {};

  const bump = (
    key: string,
    subjectName: string,
    topicName: string,
    result: "correct" | "wrong" | "empty" | "other"
  ) => {
    if (!acc[key]) {
      acc[key] = { correct: 0, wrong: 0, empty: 0, total: 0, subjectName, topicName };
    }
    acc[key].total++;
    if (result === "correct") acc[key].correct++;
    else if (result === "wrong") acc[key].wrong++;
    else if (result === "empty") acc[key].empty++;
  };

  if (matrixResults.length) {
    matrixResults.forEach((res) => {
      const mx = getResolvedExamMatrix(res.examId);
      if (!mx) return;
      (res.answers || []).forEach((a) => {
        const q = mx.questions.find((x) => x.qNo === a.qNo);
        if (!q) return;
        const topic = repairUtf8Mojibake(
          resolveTopicDisplay(
            q.subjectId,
            String(q.topicId || ""),
            "",
            q.topicName || q.subjectName
          )
        );
        const sub = repairUtf8Mojibake(q.subjectName);
        const key = `${sub}|${topic}`;
        const res =
          a.result === "correct" || a.result === "wrong" || a.result === "empty"
            ? a.result
            : "other";
        bump(key, sub, topic, res);
      });
    });
  } else {
    const all = readAnalizExamResults().filter(
      (r) => String(r.studentId) === sid || String(r.studentCode) === sid
    );
    all.forEach((r) => {
      const eid = String(r.examId);
      if (!examMatchesSinavScope(eid, sinav)) return;
      const ex = findExamById(eid);
      if (!ex) return;
      const keyStr = getAnswerKeyForExamId(String(r.examId));
      const { gauges, drillDown } = buildStudentSubjectBreakdown(
        String(r.examId),
        String(r.studentId || sid),
        keyStr
      );
      const addGauge = (sub: string, top: string, correct: number, total: number) => {
        const key = `${sub}|${top}`;
        if (!acc[key]) {
          acc[key] = { correct: 0, wrong: 0, empty: 0, total: 0, subjectName: sub, topicName: top };
        }
        acc[key].correct += correct;
        acc[key].wrong += Math.max(0, total - correct);
        acc[key].total += total;
      };
      gauges.forEach((g) => addGauge(g.name, g.name, g.correct, g.total));
      Object.entries(drillDown).forEach(([sub, topics]) => {
        topics.forEach((t) => addGauge(sub, t.name, t.correct, t.total));
      });
    });
  }

  return Object.values(acc)
    .map((v) => {
      const rate = v.total ? Math.round((1000 * v.correct) / v.total) / 10 : 0;
      return {
        subjectName: v.subjectName,
        topicName: v.topicName,
        correct: v.correct,
        wrong: v.wrong,
        empty: v.empty,
        total: v.total,
        rate,
        trend: (rate >= 70 ? "up" : rate < 50 ? "down" : "flat") as SubjectMasteryRow["trend"],
      };
    })
    .sort((a, b) => a.rate - b.rate);
}
