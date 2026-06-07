"use client";

import { useRef, useState } from "react";
import { ScanLine, Upload } from "lucide-react";

import { cn } from "@/lib/utils";

import "./txt-upload.css";

type TxtUploadDropzoneProps = {
  disabled?: boolean;
  parsing?: boolean;
  onFile: (file: File) => void;
};

export function TxtUploadDropzone({ disabled, parsing, onFile }: TxtUploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const inactive = disabled || parsing;

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        aria-label="Optik TXT dosyası yükle"
        className={cn(
          "txt-dropzone",
          inactive && "txt-dropzone--disabled",
          dragOver && !inactive && "txt-dropzone--active"
        )}
        onClick={() => {
          if (!inactive) inputRef.current?.click();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!inactive) inputRef.current?.click();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!inactive) setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!inactive) setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(false);
          if (inactive) return;
          const f = e.dataTransfer.files?.[0];
          if (f) onFile(f);
        }}
      >
        <div className="txt-dropzone-icon mb-4">
          {parsing ? (
            <ScanLine className="h-8 w-8 animate-pulse" aria-hidden />
          ) : (
            <Upload className="h-8 w-8" aria-hidden />
          )}
        </div>
        <p className="text-center text-lg font-extrabold tracking-tight text-slate-900">
          {parsing ? "Dosya analiz ediliyor…" : "TXT dosyasını sürükleyip bırakın"}
        </p>
        <p className="mt-2 max-w-md text-center text-sm text-slate-500">
          veya tıklayarak seçin —{" "}
          <span className="font-mono text-xs text-slate-600">.txt · .dat · .prn</span>
        </p>
        <p className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 shadow-sm">
          <ScanLine className="h-3 w-3 text-slate-500" aria-hidden />
          Otonom sütun eşleme
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".txt,.dat,.prn,.TXT,.DAT,.PRN"
        className="sr-only"
        disabled={inactive}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
    </>
  );
}
