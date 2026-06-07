"use client";

import { useRef } from "react";
import { Archive, FileText, Upload } from "lucide-react";

import type { PdfFileEntry } from "@/lib/test-maker/use-pdf-document";
import { PDF_MAX_BYTES } from "@/lib/test-maker/constants";
import { cn } from "@/lib/utils";

type PdfSourceCardProps = {
  files: PdfFileEntry[];
  activeFileId: string | null;
  onSelectFile: (id: string) => void;
  onLoadFiles: (list: FileList | File[]) => void;
  onOpenDeposu: () => void;
};

const MAX_MB = Math.round(PDF_MAX_BYTES / (1024 * 1024));

export function PdfSourceCard({
  files,
  activeFileId,
  onSelectFile,
  onLoadFiles,
  onOpenDeposu,
}: PdfSourceCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pickFiles = () => fileInputRef.current?.click();

  const onFilesChosen = (list: FileList | null) => {
    if (!list?.length) return;
    void onLoadFiles(list);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files?.length) void onLoadFiles(e.dataTransfer.files);
  };

  return (
    <section className="tm-pdf-source-card shrink-0 border-b border-slate-100 px-4 py-3" aria-label="PDF kaynağı">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => onFilesChosen(e.target.files)}
      />

      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
          PDF Kaynağı
        </h3>
        {files.length > 0 ? (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold tabular-nums text-slate-600">
            {files.length} dosya
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div
          role="button"
          tabIndex={0}
          id="tm-pdf-dropzone"
          className="tm-pdf-dropzone flex flex-1 cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/80 px-4 py-3 text-left transition hover:border-indigo-300 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
          onClick={pickFiles}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              pickFiles();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={onDrop}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200/80">
            <Upload className="h-4 w-4 text-slate-500" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-slate-800">PDF yükle</span>
            <span className="block text-[11px] text-slate-500">Tıkla / sürükle · maks {MAX_MB} MB</span>
          </span>
        </div>
        <button
          type="button"
          id="btn-open-pdf-deposu"
          title="PDF Deposu"
          aria-label="PDF Deposu"
          className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:flex-col sm:px-4"
          onClick={onOpenDeposu}
        >
          <Archive className="h-4 w-4 text-slate-500" />
          PDF Deposu
        </button>
      </div>

      {files.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-3 py-2 text-center text-[11px] text-slate-500">
          Henüz dosya yok
        </p>
      ) : (
        <ul id="tm-pdf-list" className="tm-pdf-source-card__list mt-3 space-y-1">
          {files.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-[11px] font-medium transition",
                  f.id === activeFileId
                    ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/40"
                )}
                onClick={() => onSelectFile(f.id)}
              >
                <FileText className="h-3.5 w-3.5 shrink-0 opacity-80" />
                <span className="truncate">{f.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
