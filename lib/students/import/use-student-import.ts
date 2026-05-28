"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { validateImportFile } from "@/lib/students/import/file-validation";
import { ImportError, mapImportError } from "@/lib/students/import/errors";
import {
  notifyImportError,
  notifyImportResult,
  notifyServerImportFailed,
  notifySessionExpired,
} from "@/lib/students/import/notify";
import { parseImportFile } from "@/lib/students/import/parse-file";
import { parseImportRows } from "@/lib/students/import/parse-rows";
import { downloadImportTemplate } from "@/lib/students/import/template";
import type { ImportApiResponse } from "@/lib/students/import/types";
import type { StudentRecord } from "@/lib/students/types";

export type StudentImportResult = ImportApiResponse & {
  parseSkipped: number;
  parseErrors: { row: number; reason: string }[];
};

type UseStudentImportOptions = {
  existingStudentCodes: string[];
  onImported?: (records: StudentRecord[]) => void;
};

export function useStudentImport({
  existingStudentCodes,
  onImported,
}: UseStudentImportOptions) {
  const router = useRouter();
  const [isImporting, setIsImporting] = useState(false);
  const [lastResult, setLastResult] = useState<StudentImportResult | null>(null);

  const clearResult = useCallback(() => setLastResult(null), []);

  const downloadTemplate = useCallback(() => {
    downloadImportTemplate();
  }, []);

  const importFile = useCallback(
    async (file: File): Promise<StudentImportResult | null> => {
      setIsImporting(true);
      setLastResult(null);

      try {
        validateImportFile(file);

        const rawRows = await parseImportFile(file);
        const { students, errors: parseErrors, skipped: parseSkipped } =
          parseImportRows(rawRows);

        if (students.length === 0) {
          const result: StudentImportResult = {
            success: false,
            imported: 0,
            skipped: parseSkipped,
            errors: parseErrors.length
              ? parseErrors
              : [{ row: 0, reason: "Dosyada geçerli satır bulunamadı." }],
            records: [],
            parseSkipped,
            parseErrors,
          };
          setLastResult(result);
          notifyImportError(
            parseErrors[0]?.reason ?? "Dosyada geçerli satır bulunamadı."
          );
          return result;
        }

        const res = await fetch("/api/students/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ students, existingStudentCodes }),
        });

        if (res.status === 401 || res.status === 403) {
          notifySessionExpired();
          return null;
        }

        if (!res.ok) {
          notifyServerImportFailed();
          return null;
        }

        const data = (await res.json()) as ImportApiResponse;
        const mergedErrors = [...parseErrors, ...data.errors];
        const totalSkipped = data.skipped + parseSkipped;

        const result: StudentImportResult = {
          ...data,
          skipped: totalSkipped,
          errors: mergedErrors,
          parseSkipped,
          parseErrors,
        };

        setLastResult(result);
        notifyImportResult({
          imported: data.imported,
          skipped: totalSkipped,
          errors: mergedErrors,
        });

        if (data.imported > 0 && data.records.length > 0) {
          onImported?.(data.records);
          router.refresh();
        }

        return result;
      } catch (e) {
        const message = mapImportError(e);
        notifyImportError(message);
        if (e instanceof ImportError && e.code === "EMPTY_FILE") {
          setLastResult({
            success: false,
            imported: 0,
            skipped: 0,
            errors: [{ row: 0, reason: message }],
            records: [],
            parseSkipped: 0,
            parseErrors: [],
          });
        }
        return null;
      } finally {
        setIsImporting(false);
      }
    },
    [existingStudentCodes, onImported, router]
  );

  return {
    downloadTemplate,
    importFile,
    isImporting,
    lastResult,
    clearResult,
  };
}
