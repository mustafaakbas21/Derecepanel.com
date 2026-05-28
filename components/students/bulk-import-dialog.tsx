"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";

import { ImportResultPanel } from "@/components/students/import-result-panel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStudentImport } from "@/lib/students/import/use-student-import";
import type { StudentRecord } from "@/lib/students/types";
import { cn } from "@/lib/utils";

type BulkImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingStudentCodes: string[];
  onImported: (records: StudentRecord[]) => void;
};

export function BulkImportDialog({
  open,
  onOpenChange,
  existingStudentCodes,
  onImported,
}: BulkImportDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const { downloadTemplate, importFile, isImporting, lastResult, clearResult } =
    useStudentImport({
      existingStudentCodes,
      onImported,
    });

  useEffect(() => {
    if (!open) clearResult();
  }, [open, clearResult]);

  const handleFile = async (file: File | undefined) => {
    if (!file || isImporting) return;
    const result = await importFile(file);
    if (result && result.imported > 0) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !isImporting && onOpenChange(o)}>
      <DialogContent className="max-w-[520px] gap-0 p-0 sm:max-w-[520px]">
        <DialogHeader className="border-b border-slate-100 px-6 py-5">
          <DialogTitle className="text-xl">Toplu içe aktar</DialogTitle>
          <DialogDescription className="text-[14px] leading-relaxed">
            Örnek Excel şablonunu indirip doldurun; dosyayı sürükleyin veya seçin.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-5">
          <Button
            type="button"
            disabled={isImporting}
            className="h-11 w-full rounded-xl bg-slate-900 text-white hover:bg-slate-800"
            onClick={() => downloadTemplate()}
          >
            <Download className="h-4 w-4" />
            Örnek Excel Şablonu İndir
          </Button>

          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            disabled={isImporting}
            onChange={(e) => {
              void handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />

          <div
            role="button"
            tabIndex={0}
            aria-label="Dosya yükleme alanı"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (!isImporting) setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (isImporting) return;
              void handleFile(e.dataTransfer.files?.[0]);
            }}
            onClick={() => !isImporting && inputRef.current?.click()}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition",
              dragOver
                ? "border-orange-400 bg-orange-50/50"
                : "border-slate-200 bg-slate-50/80 hover:border-slate-300 hover:bg-slate-50",
              isImporting && "pointer-events-none opacity-60"
            )}
          >
            {isImporting ? (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-orange-500" aria-hidden />
                <p className="mt-3 text-[15px] font-semibold text-slate-700">Yükleniyor…</p>
                <p className="mt-1 text-sm text-slate-400">Dosya işleniyor, lütfen bekleyin</p>
              </>
            ) : (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200/80">
                  <FileSpreadsheet className="h-6 w-6 text-orange-500" aria-hidden />
                </div>
                <p className="mt-4 text-[15px] font-semibold text-slate-800">
                  Dosyayı buraya sürükleyin
                </p>
                <p className="mt-1 text-sm text-slate-500">veya tıklayarak seçin</p>
                <p className="mt-3 flex items-center gap-1 text-xs text-slate-400">
                  <Upload className="h-3.5 w-3.5" aria-hidden />
                  .xlsx, .xls, .csv — en fazla 5 MB
                </p>
              </>
            )}
          </div>

          {lastResult && (lastResult.errors.length > 0 || lastResult.imported === 0) && (
            <ImportResultPanel result={lastResult} />
          )}
        </div>

        <DialogFooter className="border-t border-slate-100 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            disabled={isImporting}
            className="rounded-xl border-slate-200"
            onClick={() => onOpenChange(false)}
          >
            Kapat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
