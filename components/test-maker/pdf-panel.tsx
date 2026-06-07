"use client";

import { useEffect, useRef } from "react";

import { CropChoiceBar } from "@/components/test-maker/crop-choice-bar";
import { PdfDeposuDialog } from "@/components/test-maker/pdf-deposu-dialog";
import { PdfPreviewPanel } from "@/components/test-maker/pdf-preview-panel";
import { PdfSourceCard } from "@/components/test-maker/pdf-source-card";

import type { UsePdfDocumentReturn } from "@/lib/test-maker/use-pdf-document";
import { usePdfCrop } from "@/lib/test-maker/use-pdf-crop";
import { tmToast } from "@/lib/test-maker/notify";
import type { CropAnswerChoice } from "@/lib/test-maker/types";
import { cn } from "@/lib/utils";

type PdfPanelProps = {
  pdf: UsePdfDocumentReturn;
  onCrop: (dataUrl: string, letter?: CropAnswerChoice) => void;
  onOpenStudio: () => void;
  deposuOpen: boolean;
  onDeposuOpenChange: (open: boolean) => void;
};

/** Yalnızca PDF kartı — görsel kaynağı bu bileşenin dışında */
export function PdfPanel({
  pdf,
  onCrop,
  onOpenStudio,
  deposuOpen,
  onDeposuOpenChange,
}: PdfPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panInnerRef = useRef<HTMLDivElement>(null);

  const crop = usePdfCrop(
    pdf,
    (dataUrl, letter) => {
      onCrop(dataUrl, letter);
      tmToast.success("Soru kırpıldı ve eklendi");
    },
    { overlayRef, canvasRef, wrapRef }
  );

  useEffect(() => {
    crop.hideCropUi();
  }, [pdf.pageIndex, pdf.activeFileId]); // eslint-disable-line react-hooks/exhaustive-deps

  const cropOn = crop.cropPressed;

  return (
    <>
      <aside
        id="tm-pdf-module-card"
        className={cn(
          "tm-pdf-module-card relative z-10 flex h-auto w-full flex-col rounded-xl border border-slate-200 bg-white shadow-sm",
          cropOn && pdf.hasPdf && "ring-2 ring-amber-400 ring-offset-1"
        )}
        aria-label="PDF kaynağı ve kırpma"
      >
        <PdfSourceCard
          files={pdf.files}
          activeFileId={pdf.activeFileId}
          onSelectFile={pdf.selectFile}
          onLoadFiles={pdf.loadFiles}
          onOpenDeposu={() => onDeposuOpenChange(true)}
        />

        <PdfPreviewPanel
          pdf={pdf}
          crop={crop}
          canvasRef={canvasRef}
          canvasHostRef={canvasHostRef}
          overlayRef={overlayRef}
          wrapRef={wrapRef}
          panInnerRef={panInnerRef}
          onPickFiles={() => {
            document.getElementById("tm-pdf-dropzone")?.click();
          }}
        />

        <CropChoiceBar
          mode={crop.floaterOpen ? "crop" : "idle"}
          selectedLetter={crop.selectedLetter}
          previewDataUrl={crop.cropPreviewDataUrl}
          onSelectLetter={crop.setSelectedLetter}
          onConfirm={crop.confirmCrop}
          onCancel={crop.floaterOpen ? crop.hideCropUi : undefined}
        />

        <div className="border-t border-slate-100 p-3">
          <button
            type="button"
            id="tm-btn-crop-studio"
            disabled={!pdf.hasPdf}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
            onClick={onOpenStudio}
          >
            Geniş ekranda kırp
          </button>
        </div>
      </aside>

      <PdfDeposuDialog
        open={deposuOpen}
        onOpenChange={onDeposuOpenChange}
        onUseInWorkspace={(file) => void pdf.loadFile(file)}
      />
    </>
  );
}
