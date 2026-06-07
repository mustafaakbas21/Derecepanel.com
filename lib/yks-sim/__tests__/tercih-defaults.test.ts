import { describe, expect, it } from "vitest";

import {
  isPuanTypeSelected,
  pickDefaultPuanTypes,
  togglePuanTypeSelection,
} from "@/lib/yks-sim/tercih-defaults";

describe("tercih-defaults", () => {
  it("pickDefaultPuanTypes selects SAY EA SÖZ DİL not TYT", () => {
    const meta = ["DİL", "EA", "SAY", "SÖZ", "TYT"];
    const picked = pickDefaultPuanTypes(meta);
    expect(picked.map((p) => p.toUpperCase())).toEqual(
      expect.arrayContaining(["SAY", "EA", "SÖZ", "DİL"])
    );
    expect(picked.some((p) => p === "TYT")).toBe(false);
    expect(picked).toHaveLength(4);
  });

  it("normalizes selection for chips", () => {
    expect(isPuanTypeSelected(["SAY", "EA", "SÖZ", "DİL"], "SÖZ")).toBe(true);
    const next = togglePuanTypeSelection(["SAY", "EA"], "DİL");
    expect(isPuanTypeSelected(next, "DIL")).toBe(true);
  });
});
