"use client";

import { useRef, useState } from "react";
import { ImageIcon, Loader2, Upload, X } from "lucide-react";

import { CropChoiceBar } from "@/components/test-maker/crop-choice-bar";
import { readImageFileAsDataUrl } from "@/lib/test-maker/read-image-file";
import { prepareQuestionImageForRender } from "@/lib/test-maker/prepare-question-image";
import { tmToast } from "@/lib/test-maker/notify";
import type { CropAnswerChoice } from "@/lib/test-maker/types";
import { cn } from "@/lib/utils";

type ImageSourcePanelProps = {
  previewDataUrl: string | null;
  fileName: string | null;
  selectedLetter: CropAnswerChoice | null;
  onPreviewChange: (dataUrl: string | null, fileName: string | null) => void;
  onSelectLetter: (letter: CropAnswerChoice) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

/** PDF kırpma kartı ile aynı akış: yükle → render → şık → soru ekle */
export function ImageSourcePanel({
  previewDataUrl,
  fileName,
  selectedLetter,
  onPreviewChange,
  onSelectLetter,
  onConfirm,
  onCancel,
}: ImageSourcePanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preparing, setPreparing] = useState(false);

  const pickFile = () => fileInputRef.current?.click();

  const runRenderPass = async (rawDataUrl: string, name: string) => {
    setPreparing(true);
    onPreviewChange(null, name);
    try {
      const rendered = await prepareQuestionImageForRender(rawDataUrl);
      onPreviewChange(rendered, name);
    } catch {
      tmToast.error("Görsel işlenemedi", "Başka bir dosya deneyin");
      onPreviewChange(null, null);
    } finally {
      setPreparing(false);
    }
  };

  const loadFile = async (file: File) => {
    try {
      const raw = await readImageFileAsDataUrl(file);
      await runRenderPass(raw, file.name);
    } catch {
      tmToast.error("Görsel yüklenemedi", "Desteklenen bir görsel dosyası seçin");
    }
  };

  const onFilesChosen = (list: FileList | null) => {
    const file = list?.[0];
    if (!file) return;
    void loadFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) void loadFile(file);
  };

  const clearPreview = () => onPreviewChange(null, null);

  const choiceMode = preparing ? "idle" : previewDataUrl ? "image" : "idle";

  return (
    <section
      id="tm-image-source-card"
      className="tm-image-source-card flex h-auto w-full flex-col rounded-xl border border-slate-200 bg-white shadow-sm"
      aria-label="Görsel kaynağı"
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/80 px-3 py-2.5">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
          Görsel Kaynağı
        </h3>
        {preparing ? (
          <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
            Render
          </span>
        ) : previewDataUrl ? (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
            Hazır
          </span>
        ) : null}
      </div>

      <div className="p-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          disabled={preparing}
          onChange={(e) => onFilesChosen(e.target.files)}
        />

        {!previewDataUrl && !preparing ? (
          <div
            role="button"
            tabIndex={0}
            id="tm-image-dropzone"
            className="tm-image-dropzone flex min-h-[5.5rem] cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/90 px-4 py-4 text-left transition hover:border-slate-400 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
            onClick={pickFile}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                pickFile();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={onDrop}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200/80">
              <Upload className="h-4 w-4 text-slate-500" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-slate-800">Görsel yükle</span>
              <span className="block text-[11px] text-slate-500">
                PNG, JPG, WEBP, GIF… · PDF kırpma ile aynı render
              </span>
            </span>
          </div>
        ) : (
          <div className="tm-image-preview-card overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <ImageIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                <span className="truncate text-[11px] font-medium text-slate-700">
                  {fileName ?? "Görsel"}
                </span>
              </div>
              {!preparing ? (
                <button
                  type="button"
                  className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Görseli kaldır"
                  onClick={clearPreview}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
            <div
              className={cn(
                "tm-image-preview-wrap flex min-h-[8rem] items-center justify-center overflow-hidden bg-slate-50/80 p-2"
              )}
            >
              {preparing ? (
                <div className="flex flex-col items-center gap-2 text-slate-500">
                  <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
                  <span className="text-[11px] font-medium">A4 için render ediliyor…</span>
                </div>
              ) : previewDataUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={previewDataUrl}
                  alt="Render edilmiş soru görseli"
                  className="h-auto max-h-48 w-full object-contain object-center"
                />
              ) : null}
            </div>
            {!preparing && previewDataUrl ? (
              <div className="border-t border-slate-100 px-3 py-2">
                <button
                  type="button"
                  className="text-[11px] font-semibold text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
                  onClick={pickFile}
                >
                  Başka görsel seç
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <CropChoiceBar
        embedded
        mode={choiceMode}
        selectedLetter={selectedLetter}
        previewDataUrl={previewDataUrl}
        onSelectLetter={onSelectLetter}
        onConfirm={onConfirm}
        onCancel={previewDataUrl && !preparing ? onCancel : undefined}
      />
    </section>
  );
}
