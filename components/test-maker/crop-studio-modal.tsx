"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";

import type { UsePdfDocumentReturn } from "@/lib/test-maker/use-pdf-document";
import { cancelPdfCanvasRender, renderPdfPageToCanvas } from "@/lib/test-maker/pdf-document";
import { extractPdfRegionToDataUrlExt } from "@/lib/test-maker/pdf-crop";
import { tmToast } from "@/lib/test-maker/notify";

type CropStudioModalProps = {
  open: boolean;
  onClose: () => void;
  pdf: UsePdfDocumentReturn;
  onCrop: (dataUrl: string) => void;
};

export function CropStudioModal({ open, onClose, pdf, onCrop }: CropStudioModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [studioPage, setStudioPage] = useState(1);
  const [studioZoom, setStudioZoom] = useState(1);
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(
    null
  );
  const drawRef = useRef<{ sx: number; sy: number } | null>(null);
  const studioMetaRef = useRef({
    renderFinalScale: 1,
    renderDpr: 1,
  });

  useEffect(() => {
    if (open) {
      setStudioPage(pdf.pageIndex);
      setStudioZoom(1);
      setMarquee(null);
    }
  }, [open, pdf.pageIndex]);

  useEffect(() => {
    if (!open || !pdf.pdfDoc || !canvasRef.current || !bodyRef.current) return;
    let cancelled = false;
    const canvas = canvasRef.current;
    (async () => {
      const result = await renderPdfPageToCanvas(pdf.pdfDoc!, canvas, {
        pageIndex: studioPage,
        zoom: studioZoom,
        maxWidth: Math.max(480, bodyRef.current!.clientWidth - 64),
      });
      if (!cancelled && result && !result.cancelled) {
        studioMetaRef.current = {
          renderFinalScale: result.renderFinalScale,
          renderDpr: result.dpr,
        };
        setMarquee(null);
      }
    })();
    return () => {
      cancelled = true;
      cancelPdfCanvasRender(canvas);
    };
  }, [open, pdf.pdfDoc, studioPage, studioZoom]);

  const pageXY = (e: React.MouseEvent) => {
    const r = stageRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onStageDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const p = pageXY(e);
    drawRef.current = { sx: p.x, sy: p.y };
    setMarquee({ x: p.x, y: p.y, w: 0, h: 0 });
  };

  const onStageMove = (e: React.MouseEvent) => {
    if (!drawRef.current) return;
    const p = pageXY(e);
    const x = Math.min(drawRef.current.sx, p.x);
    const y = Math.min(drawRef.current.sy, p.y);
    const w = Math.abs(p.x - drawRef.current.sx);
    const h = Math.abs(p.y - drawRef.current.sy);
    setMarquee({ x, y, w, h });
  };

  const onStageUp = () => {
    drawRef.current = null;
  };

  const confirmCrop = () => {
    const canvas = canvasRef.current;
    const mq = document.getElementById("tm-crop-studio-marquee");
    if (!canvas || !canvas.width) {
      tmToast.error("PDF yüklenemedi", "Modalı kapatıp tekrar deneyin");
      return;
    }
    if (!marquee || marquee.w < 12 || marquee.h < 12) {
      tmToast.error("Lütfen önce fareyle bir alan seçin");
      return;
    }

    const stageRect = stageRef.current!.getBoundingClientRect();
    const frozen = new DOMRect(
      stageRect.left + marquee.x,
      stageRect.top + marquee.y,
      marquee.w,
      marquee.h
    );

    void extractPdfRegionToDataUrlExt(
      frozen,
      canvas,
      pdf.pdfDoc,
      studioPage,
      studioMetaRef.current.renderFinalScale,
      studioMetaRef.current.renderDpr
    ).then((dataUrl) => {
      if (!dataUrl) {
        tmToast.error("Kırpma oluşturulamadı", "Alanı genişletip tekrar deneyin");
        return;
      }
      onCrop(dataUrl);
      onClose();
    });
  };

  if (!open) return null;

  return (
    <div
      id="tm-crop-studio-overlay"
      className="tm-crop-studio-overlay is-open fixed inset-0 z-[20050] flex flex-col bg-slate-900/60 p-3 sm:p-5 print:hidden"
      role="dialog"
      aria-labelledby="tm-crop-studio-title"
      aria-modal="true"
    >
      <div
        id="tm-crop-studio-backdrop"
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden
      />
      <div
        id="tm-crop-studio-dialog"
        className="relative z-10 mx-auto flex h-full max-h-[92dvh] w-full max-w-[min(96vw,1400px)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3">
          <h2 id="tm-crop-studio-title" className="text-sm font-semibold text-slate-900">
            Geniş Ekranda Kırp
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="tm-crop-studio-clear"
              className="rounded-lg border px-3 py-1.5 text-xs font-semibold"
              onClick={() => setMarquee(null)}
            >
              Seçimi temizle
            </button>
            <button
              type="button"
              id="tm-crop-studio-confirm"
              className="tm-btn-primary px-3 py-1.5 text-xs"
              onClick={confirmCrop}
            >
              Soruya ekle
            </button>
            <button
              type="button"
              id="tm-crop-studio-close"
              className="rounded-lg p-2"
              onClick={onClose}
              aria-label="Kapat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div id="tm-crop-studio-chrome" className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-b px-4 py-2">
          <button
            type="button"
            id="tm-studio-page-prev"
            disabled={studioPage <= 1}
            onClick={() => setStudioPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <input
            id="tm-studio-page-num"
            type="number"
            min={1}
            max={pdf.totalPages || 1}
            value={studioPage}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              if (Number.isFinite(n)) setStudioPage(Math.max(1, Math.min(pdf.totalPages || 1, n)));
            }}
            className="h-9 w-14 rounded-lg border text-center text-xs font-semibold"
          />
          <span id="tm-studio-page-total">/ {pdf.totalPages || "—"}</span>
          <button
            type="button"
            id="tm-studio-page-next"
            disabled={!pdf.totalPages || studioPage >= pdf.totalPages}
            onClick={() => setStudioPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <span id="tm-studio-zoom-label" className="ml-2 text-xs font-semibold">
            %{Math.round(studioZoom * 100)}
          </span>
          <button type="button" id="tm-studio-zoom-out" onClick={() => setStudioZoom((z) => Math.max(0.5, z - 0.1))}>
            <ZoomOut className="h-4 w-4" />
          </button>
          <button type="button" id="tm-studio-zoom-fit" onClick={() => setStudioZoom(1)}>
            Sığdır
          </button>
          <button type="button" id="tm-studio-zoom-in" onClick={() => setStudioZoom((z) => Math.min(4, z + 0.1))}>
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>

        <div
          id="tm-crop-studio-body"
          ref={bodyRef}
          className="flex flex-1 items-center justify-center overflow-auto p-4"
        >
          <div
            id="tm-crop-studio-stage"
            ref={stageRef}
            className="relative inline-block cursor-crosshair select-none"
            onMouseDown={onStageDown}
            onMouseMove={onStageMove}
            onMouseUp={onStageUp}
            onMouseLeave={onStageUp}
          >
            <canvas id="tm-crop-studio-canvas" ref={canvasRef} className="block bg-white shadow-lg" />
            {marquee && marquee.w > 0 && (
              <div
                id="tm-crop-studio-marquee"
                className="pointer-events-none absolute border-2 border-dashed border-amber-500 bg-amber-500/10"
                style={{
                  left: marquee.x,
                  top: marquee.y,
                  width: marquee.w,
                  height: marquee.h,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
