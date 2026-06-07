import { getDerslerByTrack, getSubjects, getTopics } from "@/lib/mufredat";
import type { MufredatTrack } from "@/lib/mufredat";
import { matchMufredatFromInsightLabel } from "@/lib/weekly-planner/mufredat-match";
import type { ExamInsightsResult, HeatmapSubject, WeeklyTask } from "@/lib/weekly-planner/types";

export type SubjectCatalogItem = {
  id: string;
  name: string;
  track: MufredatTrack;
  topicTotal: number;
  topicStudied: number;
  questionCount: number;
  mrScore: number | null;
  weakTopicCount: number;
  suggestionCount: number;
};

function heatmapBySubjectId(heatmap: HeatmapSubject[]) {
  const map = new Map<string, { score: number; weak: number }>();
  heatmap.forEach((h) => {
    const m = matchMufredatFromInsightLabel(h.label);
    if (!m) return;
    const prev = map.get(m.subjectId);
    const weak = h.score < 50 ? 1 : 0;
    if (!prev) {
      map.set(m.subjectId, { score: h.score, weak });
    } else {
      map.set(m.subjectId, {
        score: Math.min(prev.score, h.score),
        weak: prev.weak + weak,
      });
    }
  });
  return map;
}

function countSuggestionsBySubject(
  insights: ExamInsightsResult,
  subjectId: string
): number {
  const fromSummary = insights.subjectSummaries?.find((s) => s.subjectId === subjectId);
  if (fromSummary) return fromSummary.suggestionCount;
  return insights.topicDiagnostics.filter(
    (d) => d.subjectId === subjectId && d.wrongCount >= 1
  ).length;
}

export function buildSubjectCatalog(
  track: MufredatTrack | "ALL",
  insights: ExamInsightsResult,
  tasks: WeeklyTask[]
): SubjectCatalogItem[] {
  const dersler = getDerslerByTrack(track);
  const hm = heatmapBySubjectId(insights.heatmap);

  const studiedTopics = new Map<string, Set<string>>();
  const questionBySubject = new Map<string, number>();

  tasks.forEach((t) => {
    if (t.taskKind === "etut_mola" || !t.subjectId) return;
    if (!studiedTopics.has(t.subjectId)) studiedTopics.set(t.subjectId, new Set());
    if (t.topicId) studiedTopics.get(t.subjectId)!.add(t.topicId);
    const q = parseInt(String(t.targetQuestions || "0"), 10);
    if (q > 0) {
      questionBySubject.set(
        t.subjectId,
        (questionBySubject.get(t.subjectId) ?? 0) + q
      );
    }
  });

  return dersler.map((d) => {
    const topicTotal = getTopics(d.id).length;
    const topicStudied = studiedTopics.get(d.id)?.size ?? 0;
    const hmEntry = hm.get(d.id);
    const subRef = getSubjects("ALL").find((s) => s.id === d.id);

    return {
      id: d.id,
      name: d.dersAdi,
      track: subRef?.track ?? "TYT",
      topicTotal,
      topicStudied,
      questionCount: questionBySubject.get(d.id) ?? 0,
      mrScore: hmEntry?.score ?? null,
      weakTopicCount: hmEntry?.weak ?? 0,
      suggestionCount: countSuggestionsBySubject(insights, d.id),
    };
  });
}
