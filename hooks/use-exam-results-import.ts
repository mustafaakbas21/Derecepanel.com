"use client";

import { useCallback } from "react";
import { toast } from "@/lib/notify";

import { clientAuthHeaders } from "@/lib/auth/require-coach";
import { persistImportOnClient } from "@/lib/exams/import/persist-client";
import type { ExamResultImportRequest } from "@/lib/exams/import/types";
import type { ParseRow } from "@/lib/exams/types";
import type { CatalogStudent } from "@/lib/exams/types";

export function useExamResultsImport() {
  const importRows = useCallback(
    async (payload: ExamResultImportRequest & { templateLabel: string }) => {
      const res = await fetch("/api/exam-results/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...clientAuthHeaders(),
        },
        body: JSON.stringify({
          examId: payload.examId,
          examName: payload.examName,
          templateId: payload.templateId,
          updateExisting: payload.updateExisting,
          createMissingStudents: payload.createMissingStudents,
          source: payload.source,
          rows: payload.rows,
          catalog: payload.catalog,
        }),
      });

      const data = (await res.json()) as {
        saved: number;
        skipped: number;
        errors: { rowId: string; message: string }[];
      };

      if (!res.ok) {
        const msg = data.errors?.[0]?.message || "Kayıt reddedildi";
        toast.error(msg);
        throw new Error(msg);
      }

      const clean = payload.rows.filter(
        (r) =>
          r.selected &&
          r.matched &&
          r.matchedId &&
          !data.errors.some((e) => e.rowId === r.id)
      );

      const n = persistImportOnClient({
        examId: payload.examId,
        examName: payload.examName,
        fileName: payload.source,
        templateId: payload.templateId,
        templateLabel: payload.templateLabel,
        updateExisting: payload.updateExisting,
        rows: clean,
      });

      return { ...data, persisted: n };
    },
    []
  );

  return { importRows };
}

export function catalogForApi(students: CatalogStudent[]) {
  return students.map((s) => ({
    id: s.id,
    code: s.code,
    name: s.name,
    coachId: s.coachId,
  }));
}
