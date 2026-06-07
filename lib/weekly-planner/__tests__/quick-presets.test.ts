import { describe, expect, it } from "vitest";

import { weeklyTaskFromQuickPreset } from "@/lib/weekly-planner/quick-presets";

describe("weeklyTaskFromQuickPreset", () => {
  it("paragraf preset uses TYT paragraf and 20 soru", () => {
    const t = weeklyTaskFromQuickPreset("paragraf", 2, "2026-05-27");
    expect(t).not.toBeNull();
    expect(t!.subjectId).toBe("tyt-tr");
    expect(t!.topicId).toBe("paragraf");
    expect(t!.targetQuestions).toBe("20");
    expect(t!.durationMin).toBe("45");
    expect(t!.taskKind).toBe("soru_cozme");
  });

  it("hazir_problem preset uses TYT problemler and 20 soru", () => {
    const t = weeklyTaskFromQuickPreset("hazir_problem", 0, "2026-05-25");
    expect(t!.subjectId).toBe("tyt-mat");
    expect(t!.topicId).toBe("problemlerGenel");
    expect(t!.targetQuestions).toBe("20");
    expect(t!.durationMin).toBe("60");
  });
});
