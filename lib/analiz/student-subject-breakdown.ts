import { buildStudentRadarDyBFallback } from "@/lib/analiz/chart-fallbacks";
import {
  computeStudentQuestionResults,
  type StudentQuestionResult,
} from "@/lib/analiz/question-results";
import { repairUtf8Mojibake } from "@/lib/exams/matrix-resolve";

export type SubjectGaugeRow = {
  name: string;
  rate: number;
  correct: number;
  total: number;
};

function aggregateFromQuestionResults(
  results: StudentQuestionResult[]
): { gauges: SubjectGaugeRow[]; drillDown: Record<string, SubjectGaugeRow[]> } {
  const acc: Record<string, { correct: number; total: number }> = {};
  const topicAcc: Record<string, Record<string, { correct: number; total: number }>> = {};

  const bump = (subject: string, topic: string, ok: boolean) => {
    const sub = repairUtf8Mojibake(subject || "Genel");
    const top = repairUtf8Mojibake(topic || sub);
    if (!acc[sub]) acc[sub] = { correct: 0, total: 0 };
    acc[sub].total++;
    if (ok) acc[sub].correct++;
    if (!topicAcc[sub]) topicAcc[sub] = {};
    if (!topicAcc[sub][top]) topicAcc[sub][top] = { correct: 0, total: 0 };
    topicAcc[sub][top].total++;
    if (ok) topicAcc[sub][top].correct++;
  };

  results.forEach((r) => {
    bump(r.subjectName, r.topicName, r.result === "correct");
  });

  const gauges: SubjectGaugeRow[] = Object.entries(acc)
    .map(([name, v]) => ({
      name,
      correct: v.correct,
      total: v.total,
      rate: v.total ? Math.round((1000 * v.correct) / v.total) / 10 : 0,
    }))
    .sort((a, b) => b.rate - a.rate);

  const drillDown: Record<string, SubjectGaugeRow[]> = {};
  Object.entries(topicAcc).forEach(([sub, topics]) => {
    drillDown[sub] = Object.entries(topics)
      .map(([name, v]) => ({
        name,
        correct: v.correct,
        total: v.total,
        rate: v.total ? Math.round((1000 * v.correct) / v.total) / 10 : 0,
      }))
      .sort((a, b) => b.rate - a.rate);
  });

  return { gauges, drillDown };
}

/** Tab2 konu bar + drill-down — matrix + cevap anahtarı + optik */
export function buildStudentSubjectBreakdown(
  examId: string,
  studentId: string,
  answerKeyStr: string
): { gauges: SubjectGaugeRow[]; drillDown: Record<string, SubjectGaugeRow[]> } {
  const results = computeStudentQuestionResults(examId, studentId, answerKeyStr);
  if (!results.length) return { gauges: [], drillDown: {} };
  return aggregateFromQuestionResults(results);
}

/** Radar — ders/konu bazlı; yoksa D/Y/B özeti eksenleri */
export function buildCompetencyRadarSeries(
  examId: string,
  student: { id: string; net: number; correct: number; wrong: number; blank: number },
  allStudents: { id: string; net: number; correct: number; wrong: number; blank: number }[],
  answerKeyStr: string
): { subject: string; student: number; class: number; top: number }[] {
  const studentGauges = buildStudentSubjectBreakdown(examId, student.id, answerKeyStr).gauges;
  if (!studentGauges.length) {
    return buildStudentRadarDyBFallback(student, allStudents);
  }

  const classBySubject: Record<string, number[]> = {};
  allStudents.forEach((st) => {
    buildStudentSubjectBreakdown(examId, st.id, answerKeyStr).gauges.forEach((row) => {
      if (!classBySubject[row.name]) classBySubject[row.name] = [];
      classBySubject[row.name]!.push(row.rate);
    });
  });

  let topStudent = student;
  let topNet = student.net;
  allStudents.forEach((st) => {
    if (st.net > topNet) {
      topNet = st.net;
      topStudent = st;
    }
  });
  const topGauges = buildStudentSubjectBreakdown(examId, topStudent.id, answerKeyStr).gauges;
  const topMap = Object.fromEntries(topGauges.map((g) => [g.name, g.rate]));

  return studentGauges.slice(0, 8).map((g) => {
    const rates = classBySubject[g.name] || [g.rate];
    const classAvg = rates.length
      ? Math.round((rates.reduce((a, b) => a + b, 0) / rates.length) * 10) / 10
      : 0;
    return {
      subject: g.name,
      student: g.rate,
      class: classAvg,
      top: topMap[g.name] ?? g.rate,
    };
  });
}
