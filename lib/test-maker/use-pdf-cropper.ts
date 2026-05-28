"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";

import {
  initPdfJs,
  loadPdfFromFile,
  renderPdfPageOffscreen,
  renderPdfPageToCanvas,
} from "@/lib/test-maker/pdf-document";
import type { ColumnMode } from "@/lib/test-maker/auto-scan-engine";
import {
  cropRegionFromCanvas,
  findQuestionBoxesByPixels,
  getPixelScanColumns,
} from "@/lib/test-maker/auto-scan-engine";
import {
  extractPdfRegionToDataUrl,
  type PdfRenderMeta,
} from "@/lib/test-maker/pdf-crop";
import { createPoolUuid } from "@/lib/test-maker/question-pool";
import type { AnswerLetter } from "@/lib/test-maker/types";
import { tmToast } from "@/lib/test-maker/notify";

export type GalleryCropItem = {
  id: string;
  dataUrl: string;
  ders: string;
  konu: string;
  kavram: string;
  page: number;
  qNumber?: string;
  answer: AnswerLetter | null;
  auto?: boolean;
  col?: string;
};

export type TagState = { ders: string; konu: string; kavram: string };

export function usePdfCropper() {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [columnMode, setColumnMode] = useState<ColumnMode>("double");
  const [toolMode, setToolMode] = useState<"crop" | "pan">("crop");
  const [gallery, setGallery] = useState<GalleryCropItem[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState({ page: 0, total: 0, found: 0 });
  const [marqueeVisible, setMarqueeVisible] = useState(false);
  const [marqueeStyle, setMarqueeStyle] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });
  const [statusText, setStatusText] = useState("Hazır");

  const scanAbortRef = useRef(false);
  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const marqueeRef = useRef<HTMLDivElement | null>(null);
  const renderMetaRef = useRef<PdfRenderMeta>({
    pageIndex: 1,
    renderFinalScale: 1,
    renderDpr: 1,
  });

  const cropDrawRef = useRef(false);
  const cropStartRef = useRef({ x: 0, y: 0 });
  const marqueeStyleRef = useRef(marqueeStyle);
  const panDragRef = useRef({
    active: false,
    x: 0,
    y: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });

  const totalPages = pdfDoc?.numPages ?? 0;

  /** Ekran koordinatı → PDF canvas üzerinde CSS piksel (kırpma kutusu ile aynı uzay) */
  const pageXY = useCallback((e: { clientX: number; clientY: number }) => {
    const canvas = pdfCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    return {
      x: Math.max(0, Math.min(x, r.width)),
      y: Math.max(0, Math.min(y, r.height)),
    };
  }, []);

  const marqueeToScreenRect = useCallback(
    (
      canvas: HTMLCanvasElement,
      m: { left: number; top: number; width: number; height: number }
    ) => {
      const r = canvas.getBoundingClientRect();
      return new DOMRect(r.left + m.left, r.top + m.top, m.width, m.height);
    },
    []
  );

  const hideMarquee = useCallback(() => {
    cropDrawRef.current = false;
    setMarqueeVisible(false);
    setMarqueeStyle({ left: 0, top: 0, width: 0, height: 0 });
  }, []);

  const loadPdf = useCallback(async (file: File) => {
    try {
      await initPdfJs();
      const doc = await loadPdfFromFile(file);
      setPdfDoc(doc);
      setFileName(file.name);
      setPageIndex(1);
      setGallery([]);
      hideMarquee();
      setStatusText("PDF yüklendi — alan seçin veya tarayın");
      tmToast.success("PDF yüklendi");
    } catch {
      /* toast inside loadPdfFromFile */
    }
  }, [hideMarquee]);

  const clearPdf = useCallback(() => {
    setPdfDoc(null);
    setFileName(null);
    setPageIndex(1);
    setGallery([]);
    hideMarquee();
    setStatusText("Hazır");
  }, [hideMarquee]);

  const renderMainCanvas = useCallback(async () => {
    const canvas = pdfCanvasRef.current;
    const wrap = wrapRef.current;
    if (!pdfDoc || !canvas || !wrap) return;
    const maxW = Math.max(320, wrap.clientWidth - 48);
    const result = await renderPdfPageToCanvas(pdfDoc, canvas, {
      pageIndex,
      zoom,
      maxWidth: maxW,
    });
    renderMetaRef.current = {
      pageIndex,
      renderFinalScale: result.renderFinalScale,
      renderDpr: result.dpr,
    };
    hideMarquee();
    setStatusText(`Sayfa ${pageIndex} / ${pdfDoc.numPages}`);
  }, [pdfDoc, pageIndex, zoom, hideMarquee]);

  useEffect(() => {
    marqueeStyleRef.current = marqueeStyle;
  }, [marqueeStyle]);

  useEffect(() => {
    void renderMainCanvas();
  }, [renderMainCanvas]);

  const validateTag = (tag: TagState) => {
    if (!tag.ders || !tag.konu) {
      tmToast.error("Kırpmadan önce Ders ve Konu seçin");
      return false;
    }
    return true;
  };

  const cropSelection = useCallback(
    async (tag: TagState) => {
      if (!validateTag(tag)) return;
      const canvas = pdfCanvasRef.current;
      if (!canvas || !pdfDoc || !marqueeVisible) {
        tmToast.warning("PDF üzerinde fare ile alan seçin");
        return;
      }
      const m = marqueeStyleRef.current;
      if (m.width < 12 || m.height < 12) {
        tmToast.warning("Seçim çok küçük");
        return;
      }

      setStatusText("Kırpılıyor…");
      const frozenRect = marqueeToScreenRect(canvas, m);
      hideMarquee();

      const dataUrl = await extractPdfRegionToDataUrl(
        frozenRect,
        canvas,
        pdfDoc,
        renderMetaRef.current
      );

      if (!dataUrl) {
        tmToast.error("Kırpma başarısız", "Daha geniş bir alan seçin");
        setStatusText("Kırpma başarısız");
        return;
      }

      const item: GalleryCropItem = {
        id: createPoolUuid(),
        dataUrl,
        ders: tag.ders,
        konu: tag.konu,
        kavram: tag.kavram,
        page: pageIndex,
        answer: null,
      };
      setGallery((g) => [...g, item]);
      tmToast.success(`Soru galeriye eklendi (#${gallery.length + 1})`);
      setStatusText(`${gallery.length + 1} soru galeride`);
    },
    [gallery.length, hideMarquee, marqueeToScreenRect, marqueeVisible, pageIndex, pdfDoc]
  );

  const runAutoScan = useCallback(
    async (tag: TagState) => {
      if (!pdfDoc) {
        tmToast.warning("Önce bir PDF yükleyin");
        return;
      }
      if (!validateTag(tag)) return;
      scanAbortRef.current = false;
      setScanning(true);
      let found = 0;
      const total = pdfDoc.numPages;
      try {
        for (let p = 1; p <= total; p++) {
          if (scanAbortRef.current) break;
          setScanProgress({ page: p, total, found });
          const { canvas, cropScale } = await renderPdfPageOffscreen(pdfDoc, p, zoom);
          const pageW = canvas.width;
          const pageH = canvas.height;
          const ctx = canvas.getContext("2d")!;
          const columns = getPixelScanColumns(pageW, cropScale, columnMode);
          for (const col of columns) {
            if (scanAbortRef.current) break;
            const boxes = findQuestionBoxesByPixels(ctx, col, pageH, cropScale);
            for (let i = 0; i < boxes.length; i++) {
              if (scanAbortRef.current) break;
              const { y1, y2 } = boxes[i];
              if (y2 - y1 < Math.round(60 * cropScale)) continue;
              const dataUrl = cropRegionFromCanvas(canvas, col, y1, y2);
              found++;
              setGallery((g) => [
                ...g,
                {
                  id: createPoolUuid(),
                  dataUrl,
                  ders: tag.ders,
                  konu: tag.konu,
                  kavram: tag.kavram,
                  page: p,
                  qNumber: String(found),
                  answer: null,
                  auto: true,
                  col: col.label,
                },
              ]);
            }
          }
          canvas.width = 0;
          canvas.height = 0;
        }
        tmToast.success(`${found} soru galeriye eklendi`);
        setStatusText(`${found} soru otomatik tarandı`);
      } catch (e) {
        console.error(e);
        tmToast.error("Tarama hatası");
      } finally {
        setScanning(false);
        setScanProgress({ page: 0, total: 0, found: 0 });
      }
    },
    [pdfDoc, zoom, columnMode]
  );

  const stopScan = () => {
    scanAbortRef.current = true;
  };

  const onWrapPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!pdfDoc || scanning) return;
      const wrap = wrapRef.current;
      if (!wrap) return;

      if (toolMode === "pan") {
        if (e.button !== 0) return;
        panDragRef.current = {
          active: true,
          x: e.clientX,
          y: e.clientY,
          scrollLeft: wrap.scrollLeft,
          scrollTop: wrap.scrollTop,
        };
        wrap.setPointerCapture(e.pointerId);
        wrap.classList.add("is-panning");
        e.preventDefault();
        setStatusText("Gezdiriliyor…");
        return;
      }

      if (toolMode !== "crop" || e.button !== 0) return;
      const host = canvasHostRef.current;
      if (!host) return;
      e.preventDefault();
      e.stopPropagation();
      cropDrawRef.current = true;
      const p = pageXY(e);
      cropStartRef.current = { x: p.x, y: p.y };
      setMarqueeVisible(true);
      setMarqueeStyle({ left: p.x, top: p.y, width: 0, height: 0 });
      setStatusText("Alan seçiliyor…");
      host.setPointerCapture(e.pointerId);
    },
    [pageXY, pdfDoc, scanning, toolMode]
  );

  const onWrapPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const wrap = wrapRef.current;
      if (!wrap) return;

      if (panDragRef.current.active && toolMode === "pan") {
        wrap.scrollLeft =
          panDragRef.current.scrollLeft - (e.clientX - panDragRef.current.x);
        wrap.scrollTop =
          panDragRef.current.scrollTop - (e.clientY - panDragRef.current.y);
        return;
      }

      if (!cropDrawRef.current || toolMode !== "crop") return;
      const p = pageXY(e);
      const x = Math.min(cropStartRef.current.x, p.x);
      const y = Math.min(cropStartRef.current.y, p.y);
      const w = Math.abs(p.x - cropStartRef.current.x);
      const h = Math.abs(p.y - cropStartRef.current.y);
      setMarqueeStyle({ left: x, top: y, width: w, height: h });
    },
    [pageXY, toolMode]
  );

  const onWrapPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const wrap = wrapRef.current;
      const host = canvasHostRef.current;
      if (wrap?.hasPointerCapture(e.pointerId)) {
        wrap.releasePointerCapture(e.pointerId);
      }
      if (host?.hasPointerCapture(e.pointerId)) {
        host.releasePointerCapture(e.pointerId);
      }
      wrap?.classList.remove("is-panning");

      if (panDragRef.current.active) {
        panDragRef.current.active = false;
        setStatusText("Hazır — alan seçin veya gezinin");
        return;
      }

      if (!cropDrawRef.current) return;
      cropDrawRef.current = false;
      const { width, height } = marqueeStyleRef.current;
      if (width < 12 || height < 12) {
        hideMarquee();
        setStatusText("Seçim iptal — tekrar deneyin");
        return;
      }
      setStatusText(
        `${Math.round(width)}×${Math.round(height)} px — «Seçili alanı kırp»`
      );
    },
    [hideMarquee]
  );

  useEffect(() => {
    if (toolMode === "pan") hideMarquee();
  }, [toolMode, hideMarquee]);

  return {
    pdfDoc,
    fileName,
    pageIndex,
    setPageIndex,
    totalPages,
    zoom,
    setZoom: (z: number) => setZoom(Math.max(0.5, Math.min(2, z))),
    columnMode,
    setColumnMode,
    toolMode,
    setToolMode,
    gallery,
    setGallery,
    scanning,
    scanProgress,
    scanAbortRef,
    loadPdf,
    clearPdf,
    cropSelection,
    runAutoScan,
    stopScan,
    pdfCanvasRef,
    wrapRef,
    canvasHostRef,
    marqueeRef,
    marqueeVisible,
    marqueeStyle,
    statusText,
    onWrapPointerDown,
    onWrapPointerMove,
    onWrapPointerUp,
    hideMarquee,
  };
}
