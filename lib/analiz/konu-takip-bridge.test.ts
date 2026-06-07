import { describe, expect, it, vi } from "vitest";

import {
  konuTakipStatusShortLabel,
  resolveKonuTakipForQuestion,
} from "@/lib/analiz/konu-takip-bridge";

vi.mock("@/lib/konu-takip/storage", () => ({
  topicKey: (s: string, t: string) => `${s}::${t}`,
  loadStudentTracking: (sid: string) => {
    if (sid !== "st-1") return {};
    return {
      "ayt-mat::polinom": {
        status: "bitti",
        solved: 40,
        target: 50,
        bookIds: [],
        updatedAt: "2026-01-01",
      },
    };
  },
}));

vi.mock("@/lib/mufredat", () => ({
  getDerslerByTrack: () => [],
  getTopics: () => [],
}));

describe("konuTakipStatusShortLabel", () => {
  it("Konu önekli etiketler", () => {
    expect(konuTakipStatusShortLabel("bitti")).toBe("Konu bitti");
    expect(konuTakipStatusShortLabel("calisiliyor")).toBe("Konu çalışılıyor");
    expect(konuTakipStatusShortLabel("baslanmadi")).toBe("Konu başlanmadı");
  });
});

describe("resolveKonuTakipForQuestion", () => {
  it("subjectId+topicId ile konu takip okur", () => {
    const ctx = resolveKonuTakipForQuestion("st-1", {
      subjectId: "ayt-mat",
      topicId: "polinom",
      topicName: "Polinomlar",
      subjectName: "AYT Matematik",
    });
    expect(ctx.status).toBe("bitti");
    expect(ctx.solved).toBe(40);
    expect(ctx.matchedById).toBe(true);
  });
});
