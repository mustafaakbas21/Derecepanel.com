import { buildClassRatesMap } from "@/lib/analiz/error-karne";
import { getAnswerKeyForExamId } from "@/lib/analiz/hydrate";
import { rateToHex } from "@/lib/analiz/chart-theme";
import { TIER_LABELS, type OtonomTierId } from "@/lib/analiz/otonom-v3";
import type { TierDetailPayload, TierDetailTopic } from "@/lib/analiz/tier-detail";
import type { TopicQuestionDetail } from "@/lib/analiz/student-topic-questions";
import {
  computeStudentQuestionResults,
  type StudentQuestionResult,
} from "@/lib/analiz/question-results";
import { buildKeyStringFromExam } from "@/lib/exams/exam-evaluate";
import { getExamLayout } from "@/lib/exams/exam-layout";
import { getResolvedExamMatrix } from "@/lib/exams/exam-matrix";
import { findExamById } from "@/lib/exams/storage/exam-storage";
import { readCoachScopedExamResults } from "@/lib/exams/storage/exam-results-storage";
import type { ExamResultRow, MergedExam } from "@/lib/exams/types";
import { repairUtf8Mojibake } from "@/lib/exams/matrix-resolve";
import type { MrTier } from "@/lib/weekly-planner/types";

export type LastExamTopicRow = {
  name: string;
  total: number;
  correct: number;
  wrong: number;
  empty: number;
  rate: number;
};

export type LastExamSubjectRow = {
  name: string;
  total: number;
  correct: number;
  wrong: number;
  empty: number;
  rate: number;
  tier: MrTier;
  issueHint: string | null;
  barColor: string;
  topics: LastExamTopicRow[];
};

export type LastExamBreakdown = {
  examId: string;
  examName: string;
  examDateISO: string;
  net: number | null;
  subjects: LastExamSubjectRow[];
  totalQuestions: number;
  totalCorrect: number;
  totalWrong: number;
  totalEmpty: number;
  emptyReason: string | null;
  analizHref: string;
};

function examHasMatrix(exam: MergedExam): boolean {
  const n = getExamLayout(exam.sinav).n;
  for (let i = 0; i < n; i++) {
    if ((exam.konuYazi?.[i] || "").trim() || (exam.konu?.[i] || "").trim()) return true;
  }
  return false;
}

function tierOf(rate: number): MrTier {
  if (rate < 40) return "kritik";
  if (rate < 55) return "dikkat";
  return "normal";
}

function issueHintFor(row: LastExamSubjectRow): string | null {
  if (row.rate < 40) return "Bu derste ciddi sıkıntı var — öncelikli çalış";
  if (row.rate < 55) return "İzleme gerekli — konu tekrarı önerilir";
  if (row.wrong + row.empty >= 3) return "Birden fazla hata — pekiştirme yapın";
  return null;
}

function aggregateResults(results: StudentQuestionResult[]): LastExamSubjectRow[] {
  const subjectAcc: Record<
    string,
    { correct: number; wrong: number; empty: number; total: number }
  > = {};
  const topicAcc: Record<string, Record<string, { correct: number; wrong: number; empty: number; total: number }>> =
    {};

  const bump = (subject: string, topic: string, result: StudentQuestionResult["result"]) => {
    const sub = repairUtf8Mojibake(subject || "Genel");
    const top = repairUtf8Mojibake(topic || sub);
    if (!subjectAcc[sub]) subjectAcc[sub] = { correct: 0, wrong: 0, empty: 0, total: 0 };
    subjectAcc[sub].total++;
    if (result === "correct") subjectAcc[sub].correct++;
    else if (result === "wrong") subjectAcc[sub].wrong++;
    else subjectAcc[sub].empty++;

    if (!topicAcc[sub]) topicAcc[sub] = {};
    if (!topicAcc[sub][top]) topicAcc[sub][top] = { correct: 0, wrong: 0, empty: 0, total: 0 };
    topicAcc[sub][top].total++;
    if (result === "correct") topicAcc[sub][top].correct++;
    else if (result === "wrong") topicAcc[sub][top].wrong++;
    else topicAcc[sub][top].empty++;
  };

  results.forEach((r) => bump(r.subjectName, r.topicName, r.result));

  return Object.entries(subjectAcc)
    .map(([name, v]) => {
      const rate = v.total ? Math.round((1000 * v.correct) / v.total) / 10 : 0;
      const topics: LastExamTopicRow[] = Object.entries(topicAcc[name] ?? {})
        .map(([tName, t]) => ({
          name: tName,
          total: t.total,
          correct: t.correct,
          wrong: t.wrong,
          empty: t.empty,
          rate: t.total ? Math.round((1000 * t.correct) / t.total) / 10 : 0,
        }))
        .sort((a, b) => a.rate - b.rate);

      const row: LastExamSubjectRow = {
        name,
        total: v.total,
        correct: v.correct,
        wrong: v.wrong,
        empty: v.empty,
        rate,
        tier: tierOf(rate),
        issueHint: null,
        barColor: rateToHex(rate),
        topics,
      };
      row.issueHint = issueHintFor(row);
      return row;
    })
    .sort((a, b) => {
      if (a.rate !== b.rate) return a.rate - b.rate;
      return b.wrong + b.empty - (a.wrong + a.empty);
    });
}

function latestMatrixExamForStudent(studentId: string): {
  exam: MergedExam;
  result: ExamResultRow;
} | null {
  const sid = String(studentId);
  const allResults = readCoachScopedExamResults().filter((r) => String(r.studentId) === sid);
  if (!allResults.length) return null;

  const byExam = new Map<string, ExamResultRow>();
  for (const r of allResults) {
    const prev = byExam.get(r.examId);
    if (!prev || String(r.savedAt) > String(prev.savedAt)) byExam.set(r.examId, r);
  }

  const sorted = [...byExam.values()].sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
  );

  for (const result of sorted) {
    const exam = findExamById(result.examId);
    if (!exam) continue;
    const layout = getExamLayout(exam.sinav);
    const keyStr = buildKeyStringFromExam(exam, layout.n);
    if (!keyStr.replace(/\s/g, "").length) continue;
    const mx = getResolvedExamMatrix(exam.id);
    if (!examHasMatrix(exam) && !mx?.questions?.length) continue;
    return { exam, result };
  }

  for (const result of sorted) {
    const exam = findExamById(result.examId);
    if (exam) return { exam, result };
  }

  return null;
}

/** Analiz Merkezi Tab2 ile aynı kaynak — tek öğrenci, son deneme, ders/konu D-Y-B */
export function buildLastExamBreakdownForStudent(studentId: string): LastExamBreakdown {
  const empty: LastExamBreakdown = {
    examId: "",
    examName: "",
    examDateISO: "",
    net: null,
    subjects: [],
    totalQuestions: 0,
    totalCorrect: 0,
    totalWrong: 0,
    totalEmpty: 0,
    emptyReason: null,
    analizHref: "/dashboard/analiz-merkezi",
  };

  if (!studentId) {
    return { ...empty, emptyReason: "Öğrenci seçin; son deneme ders özeti burada görünür." };
  }

  const latest = latestMatrixExamForStudent(studentId);
  if (!latest) {
    return {
      ...empty,
      emptyReason: "Kayıtlı deneme sonucu yok veya cevap anahtarı eksik.",
    };
  }

  const { exam, result } = latest;
  const answerKey =
    buildKeyStringFromExam(exam, getExamLayout(exam.sinav).n) ||
    getAnswerKeyForExamId(exam.id) ||
    "";

  const questionResults = computeStudentQuestionResults(exam.id, studentId, answerKey);
  if (!questionResults.length) {
    return {
      ...empty,
      examId: exam.id,
      examName: exam.ad || result.examName || "Deneme",
      examDateISO: result.savedAt,
      emptyReason:
        "Son denemede soru bazlı veri yok. Analiz Merkezi için konu matrisi ve optik sonucu gerekir.",
      analizHref: `/dashboard/analiz-merkezi?examId=${encodeURIComponent(exam.id)}&tab=5&studentId=${encodeURIComponent(studentId)}`,
    };
  }

  const subjects = aggregateResults(questionResults);
  const totalCorrect = subjects.reduce((s, r) => s + r.correct, 0);
  const totalWrong = subjects.reduce((s, r) => s + r.wrong, 0);
  const totalEmpty = subjects.reduce((s, r) => s + r.empty, 0);
  const totalQuestions = totalCorrect + totalWrong + totalEmpty;

  const netRaw = Number(result.net);
  const net = Number.isFinite(netRaw) ? netRaw : null;

  return {
    examId: exam.id,
    examName: exam.ad || result.examName || "Deneme",
    examDateISO: result.savedAt,
    net,
    subjects,
    totalQuestions,
    totalCorrect,
    totalWrong,
    totalEmpty,
    emptyReason: null,
    analizHref: `/dashboard/analiz-merkezi?examId=${encodeURIComponent(exam.id)}&tab=5&studentId=${encodeURIComponent(studentId)}`,
  };
}

function normSubjectName(name: string): string {
  return repairUtf8Mojibake(name || "")
    .trim()
    .toLowerCase();
}

/** Seçili ders — Konu Hakimiyeti modalı ile uyumlu konu + soru detayı */
export function buildLastExamSubjectTierDetail(
  breakdown: LastExamBreakdown,
  subject: LastExamSubjectRow,
  studentId: string,
  studentName: string
): TierDetailPayload | null {
  if (!breakdown.examId || !studentId) return null;

  const exam = findExamById(breakdown.examId);
  if (!exam) return null;

  const answerKey =
    buildKeyStringFromExam(exam, getExamLayout(exam.sinav).n) ||
    getAnswerKeyForExamId(exam.id) ||
    "";

  const results = computeStudentQuestionResults(breakdown.examId, studentId, answerKey);
  const classRates = buildClassRatesMap(breakdown.examId);
  const subKey = normSubjectName(subject.name);

  const byTopic = new Map<string, StudentQuestionResult[]>();
  results.forEach((r) => {
    if (normSubjectName(r.subjectName) !== subKey) return;
    const topicName = repairUtf8Mojibake(r.topicName);
    const list = byTopic.get(topicName) ?? [];
    list.push(r);
    byTopic.set(topicName, list);
  });

  const topics: TierDetailTopic[] = [...byTopic.entries()]
    .map(([topicName, qs]) => {
      let correct = 0;
      let wrong = 0;
      let empty = 0;
      const problemQuestions: TopicQuestionDetail[] = [];

      qs.forEach((q) => {
        if (q.result === "correct") correct += 1;
        else if (q.result === "wrong") {
          wrong += 1;
          problemQuestions.push({
            qNo: q.qNo,
            result: "wrong",
            examId: breakdown.examId,
            examName: breakdown.examName,
            classRate: classRates[q.qNo] ?? 0,
          });
        } else {
          empty += 1;
          problemQuestions.push({
            qNo: q.qNo,
            result: "empty",
            examId: breakdown.examId,
            examName: breakdown.examName,
            classRate: classRates[q.qNo] ?? 0,
          });
        }
      });

      const total = correct + wrong + empty;
      const rate = total ? Math.round((1000 * correct) / total) / 10 : 0;
      const declining = rate < 50 || wrong + empty >= 2;

      return {
        subjectName: subject.name,
        topicName,
        rate,
        trend: declining ? ("down" as const) : rate >= 70 ? ("up" as const) : ("flat" as const),
        correct,
        wrong,
        empty,
        problemQuestions,
        declining,
      };
    })
    .sort((a, b) => {
      if (a.declining !== b.declining) return a.declining ? -1 : 1;
      return a.rate - b.rate;
    });

  if (!topics.length && subject.topics.length) {
    subject.topics.forEach((t) => {
      topics.push({
        subjectName: subject.name,
        topicName: t.name,
        rate: t.rate,
        trend: t.rate < 50 ? "down" : t.rate >= 70 ? "up" : "flat",
        correct: t.correct,
        wrong: t.wrong,
        empty: t.empty,
        problemQuestions: [],
        declining: t.rate < 50 || t.wrong + t.empty >= 2,
      });
    });
  }

  const tier = subject.tier as OtonomTierId;
  const decliningTopics = topics.filter((t) => t.declining);

  return {
    tier,
    label: TIER_LABELS[tier],
    subtitle: `${subject.name} · ${breakdown.examName} — yanlış ve boş sorular`,
    studentName,
    examName: breakdown.examName,
    topics,
    decliningTopics,
    totalTopics: topics.length,
    totalProblemQuestions: topics.reduce((s, t) => s + t.problemQuestions.length, 0),
  };
}
