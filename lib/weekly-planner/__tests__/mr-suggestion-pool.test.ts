import { describe, expect, it } from "vitest";

import { buildBalancedSuggestionPool } from "@/lib/weekly-planner/mr-suggestion-pool";
import { diagnosticToSuggestion } from "@/lib/weekly-planner/mr-engine-v3";
import type { TopicDiagnostic } from "@/lib/weekly-planner/types";

function diag(
  subjectId: string,
  topicId: string,
  subjectName: string,
  priority: number,
  wrong: number
): TopicDiagnostic {
  return {
    label: `${subjectName} — Konu ${topicId}`,
    subjectId,
    topicId,
    subjectName,
    topicName: `Konu ${topicId}`,
    aggregateScore: 30,
    wrongCount: wrong,
    totalCount: wrong + 1,
    examsAppeared: 1,
    trend: "new_weak",
    tier: "kritik",
    priority,
    perExam: [],
  };
}

describe("buildBalancedSuggestionPool", () => {
  it("includes topics from multiple subjects", () => {
    const diagnostics = [
      diag("tyt-mat", "p1", "TYT Matematik", 90, 3),
      diag("tyt-mat", "p2", "TYT Matematik", 80, 2),
      diag("tyt-tur", "t1", "TYT Türkçe", 85, 4),
      diag("tyt-fiz", "f1", "TYT Fizik", 70, 2),
    ];
    const out = buildBalancedSuggestionPool(diagnostics, 1, diagnosticToSuggestion);
    const subjects = new Set(out.map((s) => s.subjectId));
    expect(subjects.size).toBeGreaterThanOrEqual(3);
    expect(out.length).toBeGreaterThanOrEqual(4);
  });
});
