import { isRowDirty } from "@/lib/exams/exam-parser";
import type { ParseRow } from "@/lib/exams/types";
import type {
  ExamResultImportRequest,
  ExamResultImportResponse,
  ImportCatalogStudent,
} from "@/lib/exams/import/types";

export type CoachAuthContext = {
  coachId: string;
  role: "coach" | "admin" | "institution";
};

function allowedStudentIds(
  catalog: ImportCatalogStudent[],
  ctx: CoachAuthContext
): Set<string> {
  const set = new Set<string>();
  catalog.forEach((s) => {
    if (ctx.role === "admin" || ctx.role === "institution") {
      set.add(s.id);
      return;
    }
    if (String(s.coachId || "").trim() === ctx.coachId) set.add(s.id);
  });
  return set;
}

export function validateImportRequest(
  body: ExamResultImportRequest,
  ctx: CoachAuthContext
): ExamResultImportResponse & { cleanRows: ParseRow[] } {
  const errors: { rowId: string; message: string }[] = [];
  const cleanRows: ParseRow[] = [];

  if (!body.examId?.trim()) {
    return { saved: 0, skipped: 0, errors: [{ rowId: "", message: "examId zorunlu" }], cleanRows: [] };
  }

  const catalog = body.catalog || [];
  const allow = catalog.length ? allowedStudentIds(catalog, ctx) : null;

  const selected = (body.rows || []).filter((r) => r.selected);
  if (!selected.length) {
    return {
      saved: 0,
      skipped: 0,
      errors: [{ rowId: "", message: "Seçili satır yok" }],
      cleanRows: [],
    };
  }

  let skipped = 0;

  for (const row of selected) {
    if (isRowDirty(row)) {
      skipped++;
      errors.push({ rowId: row.id, message: "Kirli satır: " + (row.issues || []).join(", ") });
      continue;
    }
    if (!row.matched || !row.matchedId) {
      skipped++;
      errors.push({ rowId: row.id, message: "Eşleşmemiş öğrenci" });
      continue;
    }
    if (allow && !allow.has(row.matchedId)) {
      skipped++;
      errors.push({ rowId: row.id, message: "Bu öğrenciye erişim yok (403)" });
      continue;
    }
    cleanRows.push(row);
  }

  return {
    saved: cleanRows.length,
    skipped,
    errors,
    cleanRows,
  };
}
