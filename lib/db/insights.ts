import { listQuestionMemoryByStudent } from "@/lib/db/question-memory";

const MS_7_DAYS = 7 * 24 * 60 * 60 * 1000;

export type OnyxInsightTopic = {
  topic: string;
  count: number;
  avgDifficulty: number;
};

export type OnyxInsightDailyPoint = {
  date: string;
  count: number;
  avgDifficulty: number;
};

export type OnyxInsightsPayload = {
  studentId: string;
  periodDays: number;
  totalQuestions: number;
  avgDifficulty: number;
  topStrugglingTopics: OnyxInsightTopic[];
  dailySeries: OnyxInsightDailyPoint[];
  recentStruggled: Array<{
    id: string;
    topic: string;
    difficultyScore: number;
    timestamp: string;
    hasImage: boolean;
  }>;
};

/** Son 7 gün — zorluk ortalaması ve en çok zorlanılan 3 konu */
export async function computeOnyxInsights(
  studentId: string,
  periodDays = 7
): Promise<OnyxInsightsPayload> {
  const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
  const records = await listQuestionMemoryByStudent(studentId, {
    since,
    limit: 500,
  });

  const totalQuestions = records.length;
  const avgDifficulty =
    totalQuestions === 0
      ? 0
      : records.reduce((s, r) => s + r.difficultyScore, 0) / totalQuestions;

  const topicMap = new Map<string, { count: number; sum: number }>();
  for (const r of records) {
    const key = r.topic.trim() || "Belirsiz konu";
    const prev = topicMap.get(key) ?? { count: 0, sum: 0 };
    topicMap.set(key, {
      count: prev.count + 1,
      sum: prev.sum + r.difficultyScore,
    });
  }

  const topStrugglingTopics: OnyxInsightTopic[] = [...topicMap.entries()]
    .map(([topic, v]) => ({
      topic,
      count: v.count,
      avgDifficulty: v.sum / v.count,
    }))
    .sort((a, b) => b.count - a.count || b.avgDifficulty - a.avgDifficulty)
    .slice(0, 3);

  const dayMap = new Map<string, { count: number; sum: number }>();
  for (const r of records) {
    const day = r.timestamp.slice(0, 10);
    const prev = dayMap.get(day) ?? { count: 0, sum: 0 };
    dayMap.set(day, {
      count: prev.count + 1,
      sum: prev.sum + r.difficultyScore,
    });
  }

  const dailySeries: OnyxInsightDailyPoint[] = [];
  for (let i = periodDays - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    const bucket = dayMap.get(key);
    dailySeries.push({
      date: key,
      count: bucket?.count ?? 0,
      avgDifficulty: bucket ? bucket.sum / bucket.count : 0,
    });
  }

  return {
    studentId,
    periodDays,
    totalQuestions,
    avgDifficulty: Math.round(avgDifficulty * 10) / 10,
    topStrugglingTopics,
    dailySeries,
    recentStruggled: records.slice(0, 12).map((r) => ({
      id: r.id,
      topic: r.topic,
      difficultyScore: r.difficultyScore,
      timestamp: r.timestamp,
      hasImage: Boolean(r.questionImage),
    })),
  };
}
