import { describe, expect, it, vi } from "vitest";

import { examMatchesSinavScope, sinavScopeLabel } from "@/lib/analiz/mastery-scope";

vi.mock("@/lib/exams/exam-storage", () => ({
  findExamById: (id: string) => {
    if (id === "tyt-1") return { id, sinav: "TYT", ad: "TYT 1" };
    if (id === "ayt-1") return { id, sinav: "AYT", ad: "AYT 1" };
    return null;
  },
}));

describe("examMatchesSinavScope", () => {
  it("sinav verilmezse tüm denemeler", () => {
    expect(examMatchesSinavScope("tyt-1", null)).toBe(true);
    expect(examMatchesSinavScope("ayt-1", undefined)).toBe(true);
  });

  it("yalnızca aynı sınav tipi", () => {
    expect(examMatchesSinavScope("tyt-1", "TYT")).toBe(true);
    expect(examMatchesSinavScope("ayt-1", "TYT")).toBe(false);
    expect(examMatchesSinavScope("ayt-1", "AYT")).toBe(true);
  });
});

describe("sinavScopeLabel", () => {
  it("TYT/AYT etiketleri", () => {
    expect(sinavScopeLabel("TYT")).toBe("TYT");
    expect(sinavScopeLabel("AYT")).toBe("AYT");
  });
});
