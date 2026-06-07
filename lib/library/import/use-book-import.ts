"use client";

import { useCallback, useState } from "react";

import { persistBookImports } from "@/lib/library/import/persist";
import { parseBookImportRows } from "@/lib/library/import/parse-rows";
import { downloadBookImportTemplate } from "@/lib/library/import/template";
import type { LibraryBook } from "@/lib/library/types";
import { ImportError, mapImportError } from "@/lib/students/import/errors";
import { validateImportFile } from "@/lib/students/import/file-validation";
import { parseImportFile } from "@/lib/students/import/parse-file";
import { appToast } from "@/lib/notify";

export type BookImportResult = {
  success: boolean;
  imported: number;
  skipped: number;
  errors: { row: number; reason: string }[];
  records: LibraryBook[];
  parseSkipped: number;
  parseErrors: { row: number; reason: string }[];
};

type UseBookImportOptions = {
  onImported?: (records: LibraryBook[]) => void;
};

function notifyBookImportResult(imported: number, skipped: number, errors: { row: number; reason: string }[]) {
  if (imported > 0 && skipped > 0) {
    appToast.success(
      `${imported} kitap eklendi, ${skipped} satır atlandı.`,
      errors.length > 0 ? errors.slice(0, 6).map((e) => (e.row > 0 ? `Satır ${e.row}: ${e.reason}` : e.reason)).join("\n") : undefined
    );
    return;
  }
  if (imported > 0) {
    appToast.success(`${imported} kitap kütüphaneye eklendi.`);
    return;
  }
  if (skipped > 0) {
    appToast.warning(`${skipped} satır atlandı; yeni kitap eklenmedi.`);
    return;
  }
  appToast.error("Dosyada geçerli satır bulunamadı.");
}

export function useBookImport({ onImported }: UseBookImportOptions = {}) {
  const [isImporting, setIsImporting] = useState(false);
  const [lastResult, setLastResult] = useState<BookImportResult | null>(null);

  const clearResult = useCallback(() => setLastResult(null), []);

  const downloadTemplate = useCallback(() => {
    downloadBookImportTemplate();
  }, []);

  const importFile = useCallback(
    async (file: File): Promise<BookImportResult | null> => {
      setIsImporting(true);
      setLastResult(null);

      try {
        validateImportFile(file);
        const rawRows = await parseImportFile(file);
        const { books, errors: parseErrors, skipped: parseSkipped } =
          parseBookImportRows(rawRows);

        if (books.length === 0) {
          const result: BookImportResult = {
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
          appToast.error(parseErrors[0]?.reason ?? "Dosyada geçerli satır bulunamadı.");
          return result;
        }

        const persisted = persistBookImports(books, parseErrors, parseSkipped);
        const result: BookImportResult = {
          success: persisted.imported > 0,
          imported: persisted.imported,
          skipped: persisted.skipped,
          errors: persisted.errors,
          records: persisted.records,
          parseSkipped,
          parseErrors,
        };

        setLastResult(result);
        notifyBookImportResult(persisted.imported, persisted.skipped, persisted.errors);

        if (persisted.imported > 0) {
          onImported?.(persisted.records);
        }

        return result;
      } catch (e) {
        const message = mapImportError(e);
        appToast.error(message);
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
    [onImported]
  );

  return {
    downloadTemplate,
    importFile,
    isImporting,
    lastResult,
    clearResult,
  };
}
