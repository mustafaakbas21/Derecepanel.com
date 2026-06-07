import { describe, expect, it } from "vitest";

import {
  DEFAULT_TEMPLATE_ID,
  getTemplateName,
  resolveTemplateId,
  TEMPLATE_REGISTRY,
} from "@/lib/test-maker/template-registry";

describe("template-registry", () => {
  it("has 10 templates", () => {
    expect(TEMPLATE_REGISTRY).toHaveLength(10);
  });

  it("resolves unknown archive sablon to derece", () => {
    expect(resolveTemplateId(undefined)).toBe(DEFAULT_TEMPLATE_ID);
    expect(resolveTemplateId("invalid")).toBe(DEFAULT_TEMPLATE_ID);
  });

  it("preserves karekök unicode id", () => {
    expect(resolveTemplateId("karekök")).toBe("karekök");
    expect(getTemplateName("karekök")).toBe("Karekök Klasik");
  });
});
