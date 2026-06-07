import { describe, expect, it } from "vitest";

import { parseLineWithTemplate } from "@/lib/exams/exam-parser";
import type { ParserTemplate } from "@/lib/exams/types";

const tabbedTpl: ParserTemplate = {
  label: "TSV",
  tabbed: true,
  minLine: 10,
  fields: [],
};

describe("parseLineWithTemplate", () => {
  it("parses tabbed line", () => {
    const row = parseLineWithTemplate(
      "1001\tAli Veli\tA\tABCDE",
      0,
      tabbedTpl,
      [],
      {},
      null
    );
    expect(row?.no).toBe("1001");
    expect(row?.name).toBe("Ali Veli");
    expect(row?.book).toBe("A");
    expect(row?.answers).toBe("ABCDE");
  });
});
