"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Hand,
  Scissors,
} from "lucide-react";

import { cancelPdfCanvasRender } from "@/lib/test-maker/pdf-document";
import type { UsePdfDocumentReturn } from "@/lib/test-maker/use-pdf-document";
import { cn } from "@/lib/utils";

type CropApi = {
  cropPressed: boolean;
  setCropPressed: (v: boolean) => void;
  toggleCrop: () => void;
  hideCropUi: () => void;
  setRenderMeta: (meta: {
    pageIndex: number;
    renderFinalScale: number;
    renderDpr: number;
  }) => void;
  dragActiveRef: RefObject<boolean | null>;
};

type PdfPreviewPanelProps = {
  pdf: UsePdfDocumentReturn;
  crop: CropApi;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  canvasHostRef: RefObject<HTMLDivElement | null>;
  overlayRef: RefObject<HTMLDivElement | null>;
  wrapRef: RefObject<HTMLDivElement | null>;
  panInnerRef: RefObject<HTMLDivElement | null>;
  onPickFiles: () => void;
};

export function PdfPreviewPanel({
  pdf,
  crop,
  canvasRef,
  canvasHostRef,
  overlayRef,
  wrapRef,
  panInnerRef,
  onPickFiles,
}: PdfPreviewPanelProps) {
  const [pageInput, setPageInput] = useState("1");
  const cropOn = crop.cropPressed;
  const panPointer = useRef({ down: false, x: 0, y: 0, ox: 0, oy: 0 });

  useEffect(() => {
    setPageInput(String(pdf.pageIndex));
  }, [pdf.pageIndex]);

  useEffect(() => {
    if (!pdf.pdfDoc || !canvasRef.current || !wrapRef.current) return;
    if (crop.dragActiveRef.current) return;
    let cancelled = false;
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const canvas = canvasRef.current;

    const render = async () => {
      if (cancelled || crop.dragActiveRef.current) return;
      const wrap = wrapRef.current!;
      let maxW = wrap.clientWidth || wrap.offsetWidth;
      if (maxW < 40) {
        await new Promise<void>((r) => requestAnimationFrame(() => r()));
        maxW = wrap.clientWidth || 320;
      }
      const result = await pdf.renderToCanvas(canvas, Math.max(160, maxW));
      if (!cancelled && result) {
        crop.setRenderMeta({
          pageIndex: pdf.pageIndex,
          renderFinalScale: result.renderFinalScale,
          renderDpr: result.dpr,
        });
        pdf.resetPan();
      }
    };

    void render();

    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            if (cancelled || crop.dragActiveRef.current) return;
            if (resizeTimer) clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => void render(), 150);
          })
        : null;
    ro?.observe(wrapRef.current);

    let winTimer: ReturnType<typeof setTimeout> | null = null;
    const onWinResize = () => {
      if (cancelled || crop.dragActiveRef.current) return;
      if (winTimer) clearTimeout(winTimer);
      winTimer = setTimeout(() => void render(), 120);
    };
    window.addEventListener("resize", onWinResize);

    return () => {
      cancelled = true;
      if (resizeTimer) clearTimeout(resizeTimer);
      if (winTimer) clearTimeout(winTimer);
      ro?.disconnect();
      window.removeEventListener("resize", onWinResize);
      cancelPdfCanvasRender(canvas);
    };
  }, [
    pdf.pdfDoc,
    pdf.pageIndex,
    pdf.zoom,
    pdf.renderGen,
    pdf.renderToCanvas,
    pdf.resetPan,
    crop.setRenderMeta,
    crop.dragActiveRef,
    canvasRef,
    wrapRef,
  ]);

  const onPanPointerDown = (e: React.PointerEvent) => {
    if (!pdf.panMode || cropOn || !pdf.pdfDoc || !wrapRef.current) return;
    if (e.button !== 0) return;
    e.preventDefault();
    try {
      wrapRef.current.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    panPointer.current = {
      down: true,
      x: e.clientX,
      y: e.clientY,
      ox: pdf.panX,
      oy: pdf.panY,
    };
  };

  const onPanPointerMove = (e: React.PointerEvent) => {
    if (!panPointer.current.down || !pdf.panMode || cropOn) return;
    pdf.setPan(
      panPointer.current.ox + (e.clientX - panPointer.current.x),
      panPointer.current.oy + (e.clientY - panPointer.current.y)
    );
  };

  const onPanPointerUp = (e: React.PointerEvent) => {
    panPointer.current.down = false;
    try {
      wrapRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  return (
    <section
      className="tm-pdf-preview-section flex flex-col"
      aria-label="PDF önizleme ve kırpma"
    >
      <div className="tm-pdf-toolbar relative z-20 shrink-0 border-b border-slate-100 px-3 py-2">
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            id="tm-page-prev"
            className="tm-pdf-toolbar__icon-btn rounded-lg border border-slate-200 p-2 disabled:opacity-40"
            disabled={!pdf.hasPdf || pdf.pageIndex <= 1}
            onClick={() => pdf.setPageIndex(pdf.pageIndex - 1)}
            aria-label="Önceki sayfa"
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
            className="tm-pdf-toolbar__icon-btn rounded-lg border border-slate-200 p-2 disabled:opacity-40"
            disabled={!pdf.hasPdf || pdf.pageIndex >= pdf.totalPages}
            onClick={() => pdf.setPageIndex(pdf.pageIndex + 1)}
            aria-label="Sonraki sayfa"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1">
            <button
              type="button"
              id="tm-btn-pan"
              title="Elle gez"
              aria-pressed={pdf.panMode}
              aria-label="Elle gez"
              disabled={!pdf.hasPdf}
              className={cn(
                "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold disabled:opacity-40",
                pdf.panMode
                  ? "border-amber-400 bg-amber-50 text-amber-800"
                  : "border-slate-200 bg-white text-slate-600"
              )}
              onClick={() => {
                pdf.setPanMode(true);
                pdf.setCropMode(false);
                crop.setCropPressed(false);
                crop.hideCropUi();
              }}
            >
              <Hand className="h-3.5 w-3.5" />
              Elle gez
            </button>
            <button
              type="button"
              id="tm-btn-crop"
              title="Soru kırpıcı"
              aria-pressed={cropOn}
              aria-label="Soru kırpıcı"
              disabled={!pdf.hasPdf}
              className={cn(
                "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold disabled:opacity-40",
                cropOn
                  ? "border-amber-400 bg-amber-50 text-amber-800 ring-2 ring-amber-300/60"
                  : "border-slate-200 bg-white text-slate-600"
              )}
              onClick={() => {
                if (pdf.panMode) pdf.setPanMode(false);
                pdf.resetPan();
                pdf.setCropMode(true);
                crop.toggleCrop();
              }}
            >
              <Scissors className="h-3.5 w-3.5" />
              Kırp
            </button>
          </div>
          <div
            id="tm-pdf-zoom"
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-1"
          >
            <button
              type="button"
              id="tm-zoom-out"
              className="px-2 py-1 text-sm font-bold disabled:opacity-40"
              disabled={!pdf.hasPdf}
              onClick={() => pdf.setZoom(Math.max(0.5, pdf.zoom - 0.1))}
              aria-label="Uzaklaştır"
            >
              −
            </button>
            <span
              id="tm-zoom-label"
              className="min-w-[3rem] text-center text-[11px] font-semibold tabular-nums"
            >
              %{Math.round(pdf.zoom * 100)}
            </span>
            <button
              type="button"
              id="tm-zoom-in"
              className="px-2 py-1 text-sm font-bold disabled:opacity-40"
              disabled={!pdf.hasPdf}
              onClick={() => pdf.setZoom(Math.min(3, pdf.zoom + 0.1))}
              aria-label="Yakınlaştır"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <p
        id="tm-pdf-preview-name"
        className="shrink-0 truncate border-b border-slate-100 px-4 py-2 text-[11px] text-slate-500"
      >
        {pdf.fileName ?? "Dosya seçilmedi"}
      </p>

      <div id="tm-pdf-scroll-slot" className="relative h-auto">
        <div
          id="tm-pdf-canvas-wrap"
          ref={wrapRef}
          className={cn(
            "tm-pdf-canvas-wrap bg-slate-100/90",
            pdf.panMode && pdf.hasPdf && !cropOn && "cursor-grab active:cursor-grabbing"
          )}
          style={{
            backgroundImage: "radial-gradient(circle, #cbd5e1 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
          onPointerDown={pdf.hasPdf && pdf.panMode && !cropOn ? onPanPointerDown : undefined}
          onPointerMove={pdf.hasPdf && pdf.panMode && !cropOn ? onPanPointerMove : undefined}
          onPointerUp={pdf.hasPdf && pdf.panMode && !cropOn ? onPanPointerUp : undefined}
          onPointerCancel={pdf.hasPdf && pdf.panMode && !cropOn ? onPanPointerUp : undefined}
        >
          <div
            id="tm-pdf-preview-empty"
            className={cn(
              "pointer-events-none flex min-h-[10rem] flex-col items-center justify-center gap-2 p-6 text-center",
              pdf.hasPdf && "hidden"
            )}
          >
            <FileText className="h-10 w-10 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">Önizleme hazır değil</p>
            <p className="text-xs text-slate-400">PDF Kaynağından dosya yükleyin</p>
            <button
              type="button"
              className="pointer-events-auto mt-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              onClick={onPickFiles}
            >
              PDF seç
            </button>
          </div>

          {pdf.hasPdf ? (
            <>
              <div
                id="tm-pdf-pan-inner"
                ref={panInnerRef}
                className="relative z-0 flex w-full max-w-full min-w-0 items-start justify-center px-2 py-4"
                style={{
                  transform: `translate(${Math.round(pdf.panX)}px, ${Math.round(pdf.panY)}px)`,
                }}
              >
                <div
                  id="tm-canvas-size-host"
                  ref={canvasHostRef}
                  className="relative h-max w-max shrink-0 shadow-lg ring-1 ring-slate-200/80"
                >
                  <canvas
                    ref={canvasRef}
                    id="tm-pdf-canvas"
                    className="block max-w-none rounded-sm bg-white shadow-lg shadow-slate-400/40 ring-1 ring-slate-200/60"
                  />

                  <div
                    id="tm-pdf-crop-marquee"
                    className="pointer-events-none absolute left-0 top-0 z-[11] rounded-sm border-2 border-dashed border-indigo-500 bg-indigo-500/10 shadow-[0_0_0_1px_rgba(99,102,241,0.3)]"
                    aria-hidden
                  />

                  {cropOn ? (
                    <div
                      id="tm-pdf-crop-overlay"
                      ref={overlayRef}
                      className="absolute inset-0 z-10 h-full w-full cursor-crosshair select-none touch-none"
                      aria-hidden
                    />
                  ) : null}
                </div>

                <p
                  id="tm-pdf-crop-hint"
                  className={cn(
                    "pointer-events-none absolute left-1/2 top-3 z-[25] -translate-x-1/2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[10px] font-semibold text-amber-800 shadow-md",
                    !cropOn && "hidden"
                  )}
                  role="status"
                >
                  ✂ Alanı sürükleyerek seçin
                </p>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
