import { evaluateRow, normalizeKeyString } from "@/lib/exams/exam-evaluate";
import type { CatalogStudent, ParseRow } from "@/lib/exams/types";
import {
  findStudentByCode,
  normalizeName,
} from "@/lib/exams/student-catalog-bridge";

import type { MappedTxtRow } from "@/lib/txtParser/types";

function resolveStudentNo(row: MappedTxtRow): string {
  if (row.studentNo.trim()) return row.studentNo.trim();
  if (row.tc.trim()) return row.tc.trim();
  return "";
}

/** Heuristic eşlemeden kanonik ParseRow[] — öğrenci kataloğu + anahtar ile */
export function mappedTxtRowsToParseRows(
  mapped: MappedTxtRow[],
  students: CatalogStudent[],
  answerKey: string | null
): ParseRow[] {
  const seenCodes: Record<string, boolean> = {};
  const out: ParseRow[] = [];

  mapped.forEach((m, idx) => {
    const no = resolveStudentNo(m);
    const cleanName = m.name.trim();
    const book = (m.booklet || "").charAt(0).toUpperCase();
    const cleanAnswers = normalizeKeyString(m.answers);
    const ev = evaluateRow(cleanAnswers, answerKey);
    const issues: ParseRow["issues"] = [];

    const row: ParseRow = {
      id: `txt-${idx}-${Math.random().toString(36).slice(2, 7)}`,
      no,
      name: cleanName,
      book,
      answers: cleanAnswers,
      correct: ev.correct,
      wrong: ev.wrong,
      blank: ev.blank,
      net: ev.net,
      sube: m.classBranch.trim(),
      matched: false,
      matchedId: null,
      studentId: null,
      status: "unmatched",
      selected: true,
      issues,
    };

    if (!row.book) issues.push("no-book");
    if (row.no) {
      if (seenCodes[row.no]) issues.push("duplicate");
      else seenCodes[row.no] = true;
    } else {
      issues.push("no-code");
    }

    const byCode = findStudentByCode(students, row.no);
    if (byCode) {
      row.matched = true;
      row.matchedId = byCode.id;
      row.studentId = byCode.id;
      row.status = "matched";
      row.sube = byCode.sube || byCode.alan || "";
      if (!row.name) row.name = byCode.name;
      row.issues = row.issues.filter((x) => x !== "unmatched" && x !== "no-code");
    } else if (row.name) {
      const nameKey = normalizeName(row.name);
      const byName = students.find((s) => normalizeName(s.name) === nameKey);
      if (byName) {
        row.matched = true;
        row.matchedId = byName.id;
        row.studentId = byName.id;
        row.status = "matched";
        row.sube = byName.sube || byName.alan || "";
        row.issues = row.issues.filter((x) => x !== "unmatched");
      }
    }

    if (!row.matched) {
      row.status = "unmatched";
      if (!row.issues.includes("unmatched")) row.issues.push("unmatched");
    }

    if (!no && !cleanName && !cleanAnswers.length) return;
    out.push(row);
  });

  return out;
}
