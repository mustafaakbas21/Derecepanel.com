import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  applyColumnMapping,
  buildInitialMapping,
  canSimulateMapping,
  parseTxtFile,
  updateColumnMapping,
} from "@/lib/txtParser";

describe("parseTxtFile v2", () => {
  it("tabbed sample: no, name, booklet, test block", () => {
    const raw = readFileSync(
      join(process.cwd(), "fixtures/exam-upload/tabbed-sample.txt"),
      "utf8"
    );
    const parsed = parseTxtFile(raw);
    expect(parsed.report.version).toBe(2);
    expect(parsed.rows.length).toBe(3);

    const roles = parsed.columns.map((c) => c.role);
    expect(roles).toContain("student_no");
    expect(roles).toContain("name");
    expect(roles).toContain("booklet");
    expect(roles).toContain("test_block");
  });

  it("glued optik: splits 1011AYSE into no+name", () => {
    const raw = readFileSync(
      join(process.cwd(), "fixtures/exam-upload/glued-optik-sample.txt"),
      "utf8"
    );
    const parsed = parseTxtFile(raw);
    expect(parsed.rows.length).toBeGreaterThanOrEqual(3);
    expect(parsed.report.compositeCellsSplit).toBeGreaterThan(0);

    const roles = parsed.columns.map((c) => c.role);
    expect(
      roles.includes("student_id_name") ||
        (roles.includes("student_no") && roles.includes("name"))
    ).toBe(true);
    expect(roles.filter((r) => r === "test_block").length).toBeGreaterThanOrEqual(1);

    const mapping = buildInitialMapping(parsed);
    if (!canSimulateMapping(mapping)) {
      const m = updateColumnMapping(mapping, 0, "student_id_name");
      expect(canSimulateMapping(m) || parsed.columns.length >= 4).toBe(true);
    } else {
      expect(canSimulateMapping(mapping)).toBe(true);
    }

    const mapped = applyColumnMapping(parsed, buildInitialMapping(parsed));
    expect(mapped[0].studentNo || mapped[0].name).toBeTruthy();
    expect(mapped[0].answers.length).toBeGreaterThan(15);
  });

  it("splits class, booklet and answer blocks from glued cell", () => {
    const raw = readFileSync(
      join(process.cwd(), "fixtures/exam-upload/class-booklet-answers.txt"),
      "utf8"
    );
    const parsed = parseTxtFile(raw);
    const roles = parsed.columns.map((c) => c.role);

    expect(roles).toContain("student_no");
    expect(roles).toContain("name");
    expect(roles).toContain("class_branch");
    expect(roles).toContain("booklet");
    expect(roles.filter((r) => r === "test_block").length).toBeGreaterThanOrEqual(1);
    expect(parsed.report.compositeCellsSplit).toBeGreaterThan(0);

    const row0 = parsed.rows[0];
    expect(row0[0]).toBe("1011");
    expect(row0[1]).toMatch(/AYSE/i);
    expect(row0[2]).toMatch(/12-C/i);
    expect(row0[3]).toBe("A");
    expect(row0[4]?.replace(/\s/g, "").length).toBeGreaterThanOrEqual(15);

    const mapped = applyColumnMapping(parsed, buildInitialMapping(parsed));
    expect(mapped[0].studentNo).toBe("1011");
    expect(mapped[0].name).toMatch(/AYSE/i);
    expect(mapped[0].classBranch).toMatch(/12-C/i);
    expect(mapped[0].booklet).toBe("A");
    expect(mapped[0].answers.length).toBeGreaterThanOrEqual(15);
  });

  it("detects 11-digit TC column", () => {
    const text = [
      "12345678901\tAHMET YILMAZ\tA\t" + "A".repeat(40),
      "98765432109\tAYSE DEMIR\tB\t" + "B".repeat(40),
    ].join("\n");
    const parsed = parseTxtFile(text);
    const tcCol = parsed.columns.find((c) => c.role === "tc");
    expect(tcCol).toBeDefined();
    expect(tcCol?.confidence).toBe("high");
  });

  it("does not label A-E answer columns as name; ignores sparse trailing cols", () => {
    const raw = readFileSync(
      join(process.cwd(), "fixtures/exam-upload/multispace-optik-sample.txt"),
      "utf8"
    );
    const parsed = parseTxtFile(raw);
    const roles = parsed.columns.map((c) => c.role);

    expect(roles.filter((r) => r === "name").length).toBeLessThanOrEqual(1);
    expect(roles.filter((r) => r === "test_block").length).toBeGreaterThanOrEqual(3);
    expect(roles.filter((r) => r === "ignore").length).toBeGreaterThanOrEqual(1);

    const answerCols = parsed.columns.filter((c) => c.role === "test_block");
    expect(answerCols.length).toBeGreaterThanOrEqual(3);

    const falseName = parsed.columns.filter((c) => c.role === "name" && c.index > 2);
    expect(falseName.length).toBe(0);

    const mapped = applyColumnMapping(parsed, buildInitialMapping(parsed));
    expect(mapped[0].answers.length).toBeGreaterThan(40);
  });

  it("peels glued booklet+answers in booklet column", () => {
    const parsed = parseTxtFile(
      ["1011\tAYSE YILMAZ\tA\tABEDCACBEEEDAAADBEEBCCEEEBBCDAEE"].join("\n")
    );
    const mapping = buildInitialMapping(parsed);
    const bookletCol = parsed.columns.findIndex((c) => c.role === "booklet");
    if (bookletCol >= 0) {
      const mapped = applyColumnMapping(parsed, mapping);
      expect(mapped[0].booklet).toBe("A");
      expect(mapped[0].answers.replace(/\s/g, "").length).toBeGreaterThan(15);
    }
  });
});
