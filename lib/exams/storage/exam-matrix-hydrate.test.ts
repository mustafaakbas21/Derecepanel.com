import { describe, expect, it } from "vitest";

import { mergeMatrixArrays } from "@/lib/exams/storage/exam-matrix-hydrate";

describe("mergeMatrixArrays", () => {
  it("keeps existing konu when payload is empty", () => {
    const prev = ["", "tyt-mat|konu1", ""];
    const next = ["", "", ""];
    const merged = mergeMatrixArrays(next, prev, 3);
    expect(merged[1]).toBe("tyt-mat|konu1");
  });

  it("prefers payload when it has data", () => {
    const prev = ["", "old", ""];
    const next = ["", "new", ""];
    const merged = mergeMatrixArrays(next, prev, 3);
    expect(merged[1]).toBe("new");
  });
});
