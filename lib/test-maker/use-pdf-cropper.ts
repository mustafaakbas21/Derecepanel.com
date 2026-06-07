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
import {
  marqueeRectFromPoints,
  syncHostToCanvas,
} from "@/lib/test-maker/pdf-crop-coords";
import { createPoolUuid } from "@/lib/test-maker/question-pool";
import type { AnswerLetter } from "@/lib/test-maker/types";
import { appToast } from "@/lib/notify";
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
  sourcePdf?: string;
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
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const marqueeRef = useRef<HTMLDivElement | null>(null);
  const renderMetaRef = useRef<PdfRenderMeta>({
    pageIndex: 1,
    renderFinalScale: 1,
    renderDpr: 1,
  });

  const cropDrawRef = useRef(false);
  const cropStartRef = useRef({ x: 0, y: 0 });
  const marqueeStyleRef = useRef({ left: 0, top: 0, width: 0, height: 0 });
  const panDragRef = useRef({
    active: false,
    x: 0,
    y: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });

  const totalPages = pdfDoc?.numPages ?? 0;

  const applyMarqueeDom = useCallback(
    (m: { left: number; top: number; width: number; height: number }, visible: boolean) => {
      marqueeStyleRef.current = m;
      const mq = marqueeRef.current;
      if (!mq) return;
      if (!visible) {
        mq.style.display = "none";
        return;
      }
      mq.style.display = "block";
      mq.style.left = `${m.left}px`;
      mq.style.top = `${m.top}px`;
      mq.style.width = `${m.width}px`;
      mq.style.height = `${m.height}px`;
    },
    []
  );

  const syncMarqueeState = useCallback(
    (m: { left: number; top: number; width: number; height: number }) => {
      marqueeStyleRef.current = m;
      setMarqueeStyle(m);
    },
    []
  );

  const marqueeToScreenRect = useCallback(
    (
      _canvas: HTMLCanvasElement,
      m: { left: number; top: number; width: number; height: number }
    ) => {
      const host = canvasHostRef.current;
      const r = host ? host.getBoundingClientRect() : _canvas.getBoundingClientRect();
      return new DOMRect(r.left + m.left, r.top + m.top, m.width, m.height);
    },
    []
  );

  const hideMarquee = useCallback(() => {
    cropDrawRef.current = false;
    setMarqueeVisible(false);
    const empty = { left: 0, top: 0, width: 0, height: 0 };
    applyMarqueeDom(empty, false);
    syncMarqueeState(empty);
  }, [applyMarqueeDom, syncMarqueeState]);

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
    const maxW = Math.max(280, wrap.clientWidth - 24);
    const result = await renderPdfPageToCanvas(pdfDoc, canvas, {
      pageIndex,
      zoom,
      maxWidth: maxW,
    });
    if (result.cancelled) return;
    renderMetaRef.current = {
      pageIndex,
      renderFinalScale: result.renderFinalScale,
      renderDpr: result.dpr,
    };
    const host = canvasHostRef.current;
    if (host) syncHostToCanvas(host, canvas);
    hideMarquee();
    setStatusText(`Sayfa ${pageIndex} / ${pdfDoc.numPages}`);
  }, [pdfDoc, pageIndex, zoom, hideMarquee]);

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
        sourcePdf: fileName ?? undefined,
      };
      setGallery((g) => [...g, item]);
      appToast.cropAddedToGallery(gallery.length + 1);
      setStatusText(`${gallery.length + 1} soru galeride`);
    },
    [gallery.length, fileName, hideMarquee, marqueeToScreenRect, marqueeVisible, pageIndex, pdfDoc]
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
      setScanProgress({ page: 0, total, found: 0 });
      setStatusText(`PDF taranıyor… (0 / ${total} sayfa)`);

      try {
        for (let p = 1; p <= total; p++) {
          if (scanAbortRef.current) break;
          setScanProgress({ page: p, total, found });
          setStatusText(`Sayfa ${p} / ${total} analiz ediliyor…`);

          let canvas: HTMLCanvasElement;
          let cropScale: number;
          try {
            const rendered = await renderPdfPageOffscreen(pdfDoc, p, {
              displayZoom: zoom,
              forAutoScan: true,
            });
            canvas = rendered.canvas;
            cropScale = rendered.cropScale;
          } catch (e) {
            console.warn("[autoScan] render", p, e);
            continue;
          }

          const pageW = canvas.width;
          const pageH = canvas.height;
          const ctx = canvas.getContext("2d");
          if (!ctx || pageW < 1 || pageH < 1) {
            canvas.width = 0;
            canvas.height = 0;
            continue;
          }

          const pageItems: GalleryCropItem[] = [];
          const columns = getPixelScanColumns(pageW, cropScale, columnMode);

          for (const col of columns) {
            if (scanAbortRef.current) break;
            let boxes: { y1: number; y2: number }[] = [];
            try {
              boxes = findQuestionBoxesByPixels(ctx, col, pageH, cropScale);
            } catch (e) {
              console.warn("[autoScan] pixels", p, col.label, e);
              continue;
            }

            for (const box of boxes) {
              if (scanAbortRef.current) break;
              const { y1, y2 } = box;
              if (y2 - y1 < Math.round(60 * cropScale)) continue;
              const dataUrl = cropRegionFromCanvas(canvas, col, y1, y2);
              found++;
              pageItems.push({
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
                sourcePdf: fileName ?? undefined,
              });
            }
          }

          if (pageItems.length) {
            setGallery((g) => [...g, ...pageItems]);
          }

          canvas.width = 0;
          canvas.height = 0;
          setScanProgress({ page: p, total, found });
          await new Promise((r) => setTimeout(r, 8));
        }

        appToast.autoScanDone(found, scanAbortRef.current);
        setStatusText(
          scanAbortRef.current
            ? found > 0
              ? `${found} soru — tarama durduruldu`
              : "Tarama durduruldu"
            : found === 0
              ? "Soru bulunamadı — manuel kırp deneyin"
              : `${found} soru otomatik tarandı`
        );
      } catch (e) {
        console.error(e);
        tmToast.error("Tarama hatası", "PDF çok büyük veya desteklenmeyen format olabilir");
        setStatusText("Tarama hatası");
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

    },
    [pdfDoc, scanning, toolMode]
  );

  const onWrapPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const wrap = wrapRef.current;
      if (!wrap || !panDragRef.current.active || toolMode !== "pan") return;
      wrap.scrollLeft =
        panDragRef.current.scrollLeft - (e.clientX - panDragRef.current.x);
      wrap.scrollTop =
        panDragRef.current.scrollTop - (e.clientY - panDragRef.current.y);
    },
    [toolMode]
  );

  useEffect(() => {
    if (toolMode !== "crop") return;
    const overlay = overlayRef.current;
    if (!overlay) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!pdfDoc || scanning || e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      cropDrawRef.current = true;
      cropStartRef.current = { x: e.offsetX, y: e.offsetY };
      applyMarqueeDom(
        { left: e.offsetX, top: e.offsetY, width: 0, height: 0 },
        true
      );
      setMarqueeVisible(true);
      setStatusText("Alan seçiliyor…");
      try {
        overlay.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!cropDrawRef.current) return;
      const rect = marqueeRectFromPoints(cropStartRef.current, {
        x: e.offsetX,
        y: e.offsetY,
      });
      applyMarqueeDom(rect, true);
    };

    const onPointerUp = (e: PointerEvent) => {
      try {
        if (overlay.hasPointerCapture(e.pointerId)) {
          overlay.releasePointerCapture(e.pointerId);
        }
      } catch {
        /* ignore */
      }
      if (!cropDrawRef.current) return;
      cropDrawRef.current = false;
      const { width, height } = marqueeStyleRef.current;
      if (width < 12 || height < 12) {
        hideMarquee();
        setStatusText("Seçim iptal — tekrar deneyin");
        return;
      }
      syncMarqueeState(marqueeStyleRef.current);
      setStatusText(
        `${Math.round(width)}×${Math.round(height)} px — «Seçili alanı kırp»`
      );
    };

    overlay.addEventListener("pointerdown", onPointerDown);
    overlay.addEventListener("pointermove", onPointerMove);
    overlay.addEventListener("pointerup", onPointerUp);
    overlay.addEventListener("pointercancel", onPointerUp);

    return () => {
      overlay.removeEventListener("pointerdown", onPointerDown);
      overlay.removeEventListener("pointermove", onPointerMove);
      overlay.removeEventListener("pointerup", onPointerUp);
      overlay.removeEventListener("pointercancel", onPointerUp);
    };
  }, [
    toolMode,
    pdfDoc,
    scanning,
    applyMarqueeDom,
    hideMarquee,
    syncMarqueeState,
  ]);

  const onWrapPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const wrap = wrapRef.current;
      if (wrap?.hasPointerCapture(e.pointerId)) {
        wrap.releasePointerCapture(e.pointerId);
      }
      wrap?.classList.remove("is-panning");

      if (panDragRef.current.active) {
        panDragRef.current.active = false;
        setStatusText("Hazır — alan seçin veya gezinin");
      }
    },
    []
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
    overlayRef,
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
