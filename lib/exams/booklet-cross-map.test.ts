import { describe, expect, it } from "vitest";

import {
  clampMasterRef,
  countFilledMappings,
  normalizeBookletMaps,
  serializeBookletMaps,
  validateBookletMaps,
} from "@/lib/exams/booklet-cross-map";

describe("booklet-cross-map", () => {
  it("normalizes and serializes sparse maps", () => {
    const maps = normalizeBookletMaps({ B: [14, 0, 3] }, 5);
    expect(maps.B).toEqual([14, 0, 3, 0, 0]);
    expect(serializeBookletMaps(maps)).toEqual({ B: [14, 0, 3, 0, 0] });
    expect(countFilledMappings(maps.B)).toBe(2);
  });

  it("validates master refs within range", () => {
    const maps = normalizeBookletMaps({ C: [1, 999] }, 40);
    const v = validateBookletMaps(maps, 40);
    expect(v.valid).toBe(false);
    expect(v.errors.length).toBeGreaterThan(0);
  });

  it("clamps master ref input", () => {
    expect(clampMasterRef("14", 120)).toBe(14);
    expect(clampMasterRef("999", 40)).toBe(40);
    expect(clampMasterRef("", 40)).toBe(0);
  });
});
