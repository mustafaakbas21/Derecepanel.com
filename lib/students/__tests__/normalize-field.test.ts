import { describe, expect, it } from "vitest";

import { normalizeStudyField } from "@/lib/students/normalize-field";

describe("normalizeStudyField", () => {
  it("maps Turkish labels", () => {
    expect(normalizeStudyField("Sözel")).toBe("sozel");
    expect(normalizeStudyField("Eşit ağırlık")).toBe("esit");
    expect(normalizeStudyField("Sayısal")).toBe("sayisal");
  });

  it("keeps canonical keys", () => {
    expect(normalizeStudyField("sozel")).toBe("sozel");
    expect(normalizeStudyField("dil")).toBe("dil");
  });
});
