import {
  filterMasteryByTier,
  filterPriorityByTier,
  TIER_LABELS,
  type OtonomTierId,
} from "@/lib/analiz/otonom-v3";
import {
  collectStudentCrossQuestions,
  questionsForTopic,
  type TopicQuestionDetail,
} from "@/lib/analiz/student-topic-questions";
import type { SubjectMasteryRow } from "@/lib/analiz/subject-mastery";
import type { PriorityRow } from "@/lib/analiz/types";

export type TierDetailTopic = {
  subjectName: string;
  topicName: string;
  rate: number;
  trend: SubjectMasteryRow["trend"];
  correct: number;
  wrong: number;
  empty: number;
  /** Yanlış veya boş sorular — düşüş / risk */
  problemQuestions: TopicQuestionDetail[];
  declining: boolean;
};

export type TierDetailPayload = {
  tier: OtonomTierId;
  label: string;
  subtitle: string;
  studentName?: string;
  examName?: string;
  topics: TierDetailTopic[];
  decliningTopics: TierDetailTopic[];
  totalTopics: number;
  totalProblemQuestions: number;
};

const TIER_SUBTITLE: Record<OtonomTierId, string> = {
  kritik: "Acil müdahale gereken konu ve sorular",
  dikkat: "İzlenmesi gereken konu ve sorular",
  normal: "Hedefe uygun performans özeti",
};

export function buildMasteryTierDetail(
  tier: OtonomTierId,
  allRows: SubjectMasteryRow[],
  studentId: string,
  studentName: string
): TierDetailPayload {
  const rows = filterMasteryByTier(allRows, tier);
  const byTopic = collectStudentCrossQuestions(studentId);

  const topics: TierDetailTopic[] = rows.map((r) => {
    const allQ = questionsForTopic(byTopic, r.subjectName, r.topicName);
    const problemQuestions = allQ.filter((q) => q.result !== "correct");
    const declining = r.trend === "down" || r.rate < 50;
    return {
      subjectName: r.subjectName,
      topicName: r.topicName,
      rate: r.rate,
      trend: r.trend,
      correct: r.correct,
      wrong: r.wrong,
      empty: r.empty,
      problemQuestions,
      declining,
    };
  });

  topics.sort((a, b) => {
    if (a.declining !== b.declining) return a.declining ? -1 : 1;
    return a.rate - b.rate;
  });

  const decliningTopics = topics.filter((t) => t.declining);
  const totalProblemQuestions = topics.reduce(
    (s, t) => s + t.problemQuestions.length,
    0
  );

  return {
    tier,
    label: TIER_LABELS[tier],
    subtitle: TIER_SUBTITLE[tier],
    studentName,
    topics,
    decliningTopics,
    totalTopics: topics.length,
    totalProblemQuestions,
  };
}

export type PriorityTierDetail = {
  tier: OtonomTierId;
  label: string;
  subtitle: string;
  examName?: string;
  rows: PriorityRow[];
  decliningRows: PriorityRow[];
  bySubject: { subjectName: string; rows: PriorityRow[] }[];
  /** Normal seviye — hedefteki dersler (%50+) */
  healthySubjects: { name: string; rate: number }[];
};

export function buildPriorityTierDetail(
  tier: OtonomTierId,
  allRows: PriorityRow[],
  examName?: string,
  subjectGauges?: { name: string; rate: number }[]
): PriorityTierDetail {
  const rows = filterPriorityByTier(allRows, tier);
  const decliningRows = rows.filter((r) => r.classCorrectRate < 50);
  const healthySubjects = (subjectGauges ?? [])
    .filter((g) => g.rate >= 50)
    .sort((a, b) => b.rate - a.rate);

  const map = new Map<string, PriorityRow[]>();
  rows.forEach((r) => {
    const list = map.get(r.subjectName) || [];
    list.push(r);
    map.set(r.subjectName, list);
  });

  const bySubject = Array.from(map.entries())
    .map(([subjectName, subjectRows]) => ({
      subjectName,
      rows: subjectRows.sort((a, b) => a.classCorrectRate - b.classCorrectRate),
    }))
    .sort((a, b) => {
      const minA = Math.min(...a.rows.map((r) => r.classCorrectRate));
      const minB = Math.min(...b.rows.map((r) => r.classCorrectRate));
      return minA - minB;
    });

  return {
    tier,
    label: TIER_LABELS[tier],
    subtitle:
      tier === "normal" && !rows.length
        ? "Kritik soru yok — sınıf geneli hedef doğrultusunda"
        : TIER_SUBTITLE[tier],
    examName,
    rows,
    decliningRows,
    bySubject,
    healthySubjects,
  };
}
