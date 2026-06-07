import { describe, expect, it } from "vitest";

import { normalizeName, nameSimilarity } from "@/lib/exams/student-catalog-bridge";

describe("normalizeName", () => {
  it("folds Turkish characters", () => {
    expect(normalizeName("Öğrenci Ş")).toBe("ogrenci s");
    expect(normalizeName("İstanbul")).toBe("istanbul");
  });

  it("similarity is 1 for identical", () => {
    expect(nameSimilarity("Ahmet Yılmaz", "Ahmet Yilmaz")).toBeGreaterThan(0.9);
  });
});
