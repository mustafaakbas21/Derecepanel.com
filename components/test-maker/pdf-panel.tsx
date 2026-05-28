"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Upload } from "lucide-react";

import type { UsePdfDocumentReturn } from "@/lib/test-maker/use-pdf-document";
import { usePdfCrop } from "@/lib/test-maker/use-pdf-crop";
import { tmToast } from "@/lib/test-maker/notify";
import type { AnswerLetter } from "@/lib/test-maker/types";
import { cn } from "@/lib/utils";

type PdfPanelProps = {
  pdf: UsePdfDocumentReturn;
  onCrop: (dataUrl: string, letter?: AnswerLetter) => void;
  onOpenStudio: () => void;
};

const LETTERS: AnswerLetter[] = ["A", "B", "C", "D", "E"];

export function PdfPanel({ pdf, onCrop, onOpenStudio }: PdfPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [pageInput, setPageInput] = useState("1");

  const crop = usePdfCrop(pdf, (dataUrl, letter) => {
    onCrop(dataUrl, letter);
    tmToast.success("Soru kırpıldı ve eklendi");
  });

  useEffect(() => {
    setPageInput(String(pdf.pageIndex));
  }, [pdf.pageIndex]);

  useEffect(() => {
    if (!pdf.pdfDoc || !canvasRef.current || !wrapRef.current) return;
    if (crop.dragActiveRef.current) return;
    let cancelled = false;
    (async () => {
      const canvas = canvasRef.current!;
      const maxW = Math.max(160, wrapRef.current!.clientWidth || 320);
      const result = await pdf.renderToCanvas(canvas, maxW);
      if (!cancelled && result) {
        crop.setRenderMeta({
          pageIndex: pdf.pageIndex,
          renderFinalScale: result.renderFinalScale,
          renderDpr: result.dpr,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pdf.pdfDoc, pdf.pageIndex, pdf.zoom, pdf.renderGen, pdf, crop]);

  useEffect(() => {
    const inner = document.getElementById("tm-pdf-pan-inner");
    if (inner) {
      inner.style.transform = `translate(${pdf.panX}px, ${pdf.panY}px)`;
    }
  }, [pdf.panX, pdf.panY]);

  const panPointer = useRef({ down: false, sx: 0, sy: 0, ox: 0, oy: 0 });

  const onPanPointerDown = (e: React.PointerEvent) => {
    if (!pdf.panMode || !pdf.pdfDoc) return;
    panPointer.current = {
      down: true,
      sx: e.clientX,
      sy: e.clientY,
      ox: pdf.panX,
      oy: pdf.panY,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPanPointerMove = (e: React.PointerEvent) => {
    if (!panPointer.current.down || !pdf.panMode) return;
    pdf.setPan(
      panPointer.current.ox + (e.clientX - panPointer.current.sx),
      panPointer.current.oy + (e.clientY - panPointer.current.sy)
    );
  };

  const onPanPointerUp = () => {
    panPointer.current.down = false;
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length) void pdf.loadFiles(e.dataTransfer.files);
  };

  const cropOn = crop.cropPressed;

  return (
    <div id="tm-pdf-preview-panel" className="tm-premium-card flex h-full min-h-[520px] flex-col overflow-hidden">
      <div className="border-b border-slate-100 px-4 py-3">
        <p className="text-sm font-bold text-slate-800">PDF Kaynağı</p>
        <div
          className="tm-dropzone tm-pdf-dropzone mt-2 px-4 py-5"
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
        >
          <Upload className="h-6 w-6 text-slate-400" />
          <label className="tm-btn-link mt-2 cursor-pointer text-xs">
            PDF seç
            <input
              type="file"
              accept="application/pdf"
              multiple
              className="sr-only"
              onChange={(e) => {
                if (e.target.files?.length) void pdf.loadFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </div>

      <div className="tm-pdf-toolbar border-b border-slate-100 px-2 py-2">
        <div className="tm-pdf-toolbar__pages flex items-center justify-center gap-1">
          <button
            type="button"
            id="tm-page-prev"
            className="tm-pdf-toolbar__icon-btn rounded-lg border p-2 disabled:opacity-40"
            disabled={pdf.pageIndex <= 1}
            onClick={() => pdf.setPageIndex(pdf.pageIndex - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <input
            id="tm-page-num"
            type="number"
            className="tm-pdf-page-num-input"
            min={1}
            max={pdf.totalPages || 1}
            value={pageInput}
            disabled={!pdf.hasPdf}
            onChange={(e) => setPageInput(e.target.value)}
            onBlur={() => pdf.commitPageInput(pageInput)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                pdf.commitPageInput(pageInput);
                (e.target as HTMLInputElement).blur();
              }
            }}
          />
          <span className="text-xs font-semibold text-slate-600">
            / <span id="tm-page-total">{pdf.totalPages || "—"}</span>
          </span>
          <button
            type="button"
            id="tm-page-next"
            className="tm-pdf-toolbar__icon-btn rounded-lg border p-2 disabled:opacity-40"
            disabled={!pdf.totalPages || pdf.pageIndex >= pdf.totalPages}
            onClick={() => pdf.setPageIndex(pdf.pageIndex + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="tm-pdf-toolbar__tools mt-2 flex flex-wrap items-center justify-between gap-2">
          <div className="tm-pdf-toolbar__cluster flex gap-1">
            <button
              type="button"
              id="tm-btn-pan"
              aria-pressed={pdf.panMode}
              title="Elle gez"
              className={cn(
                "tm-pdf-toolbar__icon-btn rounded-lg border px-2 py-1.5 text-xs font-semibold",
                pdf.panMode && "bg-amber-50 text-amber-600 ring-2 ring-amber-300"
              )}
              onClick={() => {
                pdf.setPanMode(true);
                pdf.setCropMode(false);
                crop.setCropPressed(false);
                crop.hideCropUi();
              }}
            >
              Pan
            </button>
            <button
              type="button"
              id="tm-btn-crop"
              aria-pressed={cropOn}
              title="Soru kırpıcı"
              className={cn(
                "tm-pdf-toolbar__icon-btn rounded-lg border px-2 py-1.5 text-xs font-semibold",
                cropOn && "bg-amber-50 text-amber-600 ring-2 ring-amber-300"
              )}
              onClick={() => {
                if (pdf.panMode) {
                  pdf.setPanMode(false);
                }
                pdf.setCropMode(true);
                crop.toggleCrop();
              }}
            >
              Kırp
            </button>
          </div>
          <div id="tm-pdf-zoom" className="tm-pdf-toolbar__zoom flex items-center gap-1 rounded-lg border bg-white px-1">
            <button
              type="button"
              id="tm-zoom-out"
              className="p-1 text-sm font-bold"
              onClick={() => pdf.setZoom(Math.max(0.5, pdf.zoom - 0.1))}
            >
              −
            </button>
            <span id="tm-zoom-label" className="tm-pdf-toolbar__zoom-label min-w-[3rem] text-center text-[11px] font-semibold">
              %{Math.round(pdf.zoom * 100)}
            </span>
            <button
              type="button"
              id="tm-zoom-in"
              className="p-1 text-sm font-bold"
              onClick={() => pdf.setZoom(Math.min(4, pdf.zoom + 0.1))}
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 border-b border-slate-100 px-3 py-2">
        <span
          id="tm-pdf-preview-name"
          className="min-w-0 flex-1 truncate text-[10px] italic text-slate-400"
        >
          {pdf.fileName ?? "Dosya seçilmedi"}
        </span>
      </div>

      <div className="flex shrink-0 justify-center border-t border-slate-100 py-2">
        <button
          type="button"
          id="tm-btn-crop-studio"
          disabled={!pdf.hasPdf}
          className="w-full max-w-full rounded-[10px] border border-slate-200 px-4 py-2.5 text-[11px] font-semibold text-slate-700 disabled:opacity-45"
          onClick={onOpenStudio}
        >
          Geniş Ekranda Kırp
        </button>
      </div>

      <div
        id="tm-pdf-scroll-slot"
        className="relative isolate z-[1] min-h-0 flex-1 overflow-hidden rounded-b-xl"
      >
        <div
          id="tm-pdf-canvas-wrap"
          ref={wrapRef}
          className={cn(
            "absolute inset-0 z-0 overflow-auto overscroll-contain bg-slate-100/80 shadow-inner",
            cropOn && "ring-2 ring-amber-400 ring-offset-1"
          )}
          style={{
            backgroundImage: "radial-gradient(circle, #cbd5e1 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
          onMouseDownCapture={crop.onWrapMouseDown}
        >
          <div
            id="tm-pdf-preview-empty"
            className={cn(
              "pointer-events-none absolute inset-0 z-[2] flex flex-col items-center justify-center p-8 text-center text-sm text-slate-400",
              pdf.hasPdf && "hidden"
            )}
          >
            Önizleme hazır değil — PDF yükleyin
          </div>

          <p
            id="tm-pdf-crop-hint"
            className={cn(
              "pointer-events-none absolute left-1/2 top-3 z-[25] -translate-x-1/2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[10px] font-semibold text-amber-800 shadow-md",
              !cropOn && "hidden"
            )}
          >
            Alanı sürükleyerek seçin
          </p>

          <div
            id="tm-pdf-pan-inner"
            className="relative z-[0] flex min-h-full min-w-full items-start justify-center px-2 py-4"
            onPointerDown={onPanPointerDown}
            onPointerMove={onPanPointerMove}
            onPointerUp={onPanPointerUp}
          >
            <div
              id="tm-canvas-size-host"
              style={{ position: "relative", flexShrink: 0, minWidth: 1, minHeight: 1 }}
            >
              <div
                id="tm-canvas-scale-wrap"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  transformOrigin: "top left",
                }}
              >
                <canvas
                  ref={canvasRef}
                  id="tm-pdf-canvas"
                  className={cn(
                    "max-w-none rounded-sm shadow-lg ring-1 ring-slate-200/60",
                    !pdf.hasPdf && "hidden"
                  )}
                />
              </div>
            </div>

            <div
              id="tm-pdf-crop-marquee"
              className={cn(
                "pointer-events-none absolute z-[24] rounded-sm border-2 border-dashed border-amber-500 bg-amber-500/10",
                !crop.marqueeVisible && "hidden"
              )}
              style={{
                left: marqueeStyle(crop.marqueeStyle.left),
                top: marqueeStyle(crop.marqueeStyle.top),
                width: marqueeStyle(crop.marqueeStyle.width),
                height: marqueeStyle(crop.marqueeStyle.height),
              }}
              aria-hidden
            />

            <div
              id="tm-pdf-crop-floater"
              className={cn(
                "pointer-events-auto absolute z-[100] flex min-w-0 flex-col gap-1.5 rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-xl",
                !crop.floaterVisible && "hidden"
              )}
              style={{
                left: marqueeStyle(crop.marqueeStyle.left),
                top: marqueeStyle(crop.marqueeStyle.top + crop.marqueeStyle.height + 8),
              }}
              role="dialog"
              aria-label="Kırpma — doğru şık"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="px-0.5 text-[10px] font-semibold text-slate-500">
                Doğru şıkkı seçin, ardından Tamam
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <div className="flex flex-wrap gap-1" role="group" aria-label="Şıklar">
                  {LETTERS.map((L) => (
                    <button
                      key={L}
                      type="button"
                      className={cn(
                        "tm-pdf-crop-letter min-w-[2rem] rounded-md border px-2.5 py-1.5 text-center text-[12px] font-bold",
                        crop.selectedLetter === L
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                          : "border-slate-200 bg-slate-100 text-slate-700"
                      )}
                      data-letter={L}
                      onClick={() => crop.setSelectedLetter(L)}
                    >
                      {L}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  id="tm-pdf-crop-ok"
                  disabled={!crop.selectedLetter}
                  className="tm-btn-primary px-4 py-1.5 text-[12px] disabled:cursor-not-allowed disabled:opacity-40"
                  onClick={() => crop.confirmCrop()}
                >
                  Tamam
                </button>
                <button
                  type="button"
                  id="tm-pdf-crop-cancel"
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600"
                  onClick={() => crop.hideCropUi()}
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function marqueeStyle(n: number) {
  return `${n}px`;
}
