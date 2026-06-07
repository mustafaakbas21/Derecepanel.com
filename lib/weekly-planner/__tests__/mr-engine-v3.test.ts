import { describe, expect, it } from "vitest";

import { detectTopicTrend, priorityScore } from "@/lib/weekly-planner/mr-engine-v3";

describe("detectTopicTrend", () => {
  it("persistent when weak in multiple exams", () => {
    const perExam = [
      { correct: 0, wrong: 2, total: 2 },
      { correct: 1, wrong: 3, total: 4 },
      { correct: 0, wrong: 1, total: 1 },
    ];
    expect(detectTopicTrend(perExam, 20)).toBe("persistent");
  });

  it("falling when newest score drops vs oldest", () => {
    const perExam = [
      { correct: 1, wrong: 4, total: 5 },
      { correct: 3, wrong: 2, total: 5 },
      { correct: 4, wrong: 1, total: 5 },
    ];
    expect(detectTopicTrend(perExam, 53)).toBe("falling");
  });

  it("recovering when improving across window", () => {
    const perExam = [
      { correct: 4, wrong: 1, total: 5 },
      { correct: 2, wrong: 3, total: 5 },
      { correct: 1, wrong: 4, total: 5 },
    ];
    expect(detectTopicTrend(perExam, 47)).toBe("recovering");
  });
});

describe("priorityScore", () => {
  it("ranks persistent weak topics higher", () => {
    const base = priorityScore(30, "stable", 2, 5);
    const persistent = priorityScore(30, "persistent", 3, 8);
    expect(persistent).toBeGreaterThan(base);
  });
});
