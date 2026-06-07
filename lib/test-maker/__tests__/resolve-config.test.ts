import { describe, expect, it } from "vitest";

import { getSubjects, getTopics } from "@/lib/mufredat";
import { resolveConfigFromLabels } from "@/lib/test-maker/resolve-config";

describe("resolveConfigFromLabels", () => {
  it("boş etiketlerde id üretmez", () => {
    const r = resolveConfigFromLabels("", "");
    expect(r.dersId).toBe("");
    expect(r.konuId).toBe("");
  });

  it("bilinen ders adından id çözer", () => {
    const sub = getSubjects("ALL")[0];
    if (!sub) return;
    const r = resolveConfigFromLabels(sub.name, "");
    expect(r.dersId).toBe(sub.id);
    expect(r.dersLabel).toBe(sub.name);
  });

  it("ders + konu eşleşmesi", () => {
    const sub = getSubjects("ALL")[0];
    if (!sub) return;
    const top = getTopics(sub.id)[0];
    if (!top) return;
    const r = resolveConfigFromLabels(sub.name, top.name);
    expect(r.dersId).toBe(sub.id);
    expect(r.konuId).toBe(top.id);
  });
});
