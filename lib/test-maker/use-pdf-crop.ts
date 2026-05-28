"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  extractPdfRegionToDataUrl,
  type PdfRenderMeta,
} from "@/lib/test-maker/pdf-crop";
import type { UsePdfDocumentReturn } from "@/lib/test-maker/use-pdf-document";
import { tmToast } from "@/lib/test-maker/notify";
import type { AnswerLetter } from "@/lib/test-maker/types";

type OnCropDone = (dataUrl: string, letter: AnswerLetter) => void;

/** ESKİ initCropMode — inline PDF kırpma */
export function usePdfCrop(pdf: UsePdfDocumentReturn, onCrop: OnCropDone) {
  const [cropPressed, setCropPressed] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<AnswerLetter | null>(null);
  const [marqueeVisible, setMarqueeVisible] = useState(false);
  const [floaterVisible, setFloaterVisible] = useState(false);
  const [marqueeStyle, setMarqueeStyle] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });

  const drawingRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0 });
  const dragActiveRef = useRef(false);
  const renderMetaRef = useRef<PdfRenderMeta>({
    pageIndex: 1,
    renderFinalScale: 1,
    renderDpr: 1,
  });

  const setRenderMeta = useCallback((meta: PdfRenderMeta) => {
    renderMetaRef.current = meta;
  }, []);

  const hideCropUi = useCallback(() => {
    drawingRef.current = false;
    dragActiveRef.current = false;
    setMarqueeVisible(false);
    setFloaterVisible(false);
    setSelectedLetter(null);
    setMarqueeStyle({ left: 0, top: 0, width: 0, height: 0 });
  }, []);

  const pageXY = useCallback((e: MouseEvent | React.MouseEvent) => {
    const panInner = document.getElementById("tm-pdf-pan-inner");
    const wrap = document.getElementById("tm-pdf-canvas-wrap");
    const node = panInner || wrap;
    const r = node?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }, []);

  const confirmCrop = useCallback(() => {
    if (!selectedLetter) return;
    const letter = selectedLetter;
    const marquee = document.getElementById("tm-pdf-crop-marquee");
    const frozenRect = marquee ? marquee.getBoundingClientRect() : null;
    hideCropUi();

    const canvas = document.getElementById("tm-pdf-canvas") as HTMLCanvasElement | null;
    void extractPdfRegionToDataUrl(
      frozenRect,
      canvas,
      pdf.pdfDoc,
      {
        pageIndex: renderMetaRef.current.pageIndex,
        renderFinalScale: renderMetaRef.current.renderFinalScale,
        renderDpr: renderMetaRef.current.renderDpr,
      }
    ).then((dataUrl) => {
      if (!dataUrl) {
        tmToast.error(
          "Kırpma alanı çok küçük veya geçersiz",
          "PDF üzerinde daha geniş bir alan seçip tekrar deneyin"
        );
        return;
      }
      onCrop(dataUrl, letter);
    });
  }, [selectedLetter, hideCropUi, pdf.pdfDoc, onCrop]);

  const onWrapMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!cropPressed || !pdf.pdfDoc) return;
      const empty = document.getElementById("tm-pdf-preview-empty");
      if (empty && !empty.classList.contains("hidden")) return;
      if (e.button !== 0) return;
      if ((e.target as HTMLElement).closest("#tm-pdf-crop-floater")) return;

      const marquee = document.getElementById("tm-pdf-crop-marquee");
      if (floaterVisible && marquee && !marquee.classList.contains("hidden")) {
        const p = pageXY(e);
        const ml = parseFloat(marquee.style.left) || 0;
        const mt = parseFloat(marquee.style.top) || 0;
        const mw = parseFloat(marquee.style.width) || 0;
        const mh = parseFloat(marquee.style.height) || 0;
        if (p.x >= ml && p.x <= ml + mw && p.y >= mt && p.y <= mt + mh) return;
      }

      e.preventDefault();
      e.stopPropagation();
      hideCropUi();
      drawingRef.current = true;
      dragActiveRef.current = true;
      const p = pageXY(e);
      startRef.current = { x: p.x, y: p.y };
      setMarqueeVisible(true);
      setMarqueeStyle({ left: p.x, top: p.y, width: 0, height: 0 });
    },
    [cropPressed, pdf.pdfDoc, floaterVisible, pageXY, hideCropUi]
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!drawingRef.current) return;
      const p = pageXY(e);
      const x = Math.min(startRef.current.x, p.x);
      const y = Math.min(startRef.current.y, p.y);
      const w = Math.abs(p.x - startRef.current.x);
      const h = Math.abs(p.y - startRef.current.y);
      setMarqueeStyle({ left: x, top: y, width: w, height: h });
    };

    const onUp = () => {
      if (!drawingRef.current) return;
      drawingRef.current = false;
      dragActiveRef.current = false;
      if (!cropPressed) return;
      const mq = document.getElementById("tm-pdf-crop-marquee");
      const w = parseFloat(mq?.style.width || "0");
      const h = parseFloat(mq?.style.height || "0");
      if (w < 12 || h < 12) {
        hideCropUi();
        return;
      }
      setSelectedLetter(null);
      setFloaterVisible(true);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [cropPressed, hideCropUi, pageXY]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && floaterVisible) {
        e.preventDefault();
        hideCropUi();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [floaterVisible, hideCropUi]);

  const toggleCrop = useCallback(() => {
    setCropPressed((on) => {
      const next = !on;
      if (!next) hideCropUi();
      return next;
    });
  }, [hideCropUi]);

  return {
    cropPressed,
    setCropPressed: setCropPressed,
    toggleCrop,
    selectedLetter,
    setSelectedLetter,
    marqueeVisible,
    floaterVisible,
    marqueeStyle,
    hideCropUi,
    confirmCrop,
    onWrapMouseDown,
    setRenderMeta,
    dragActiveRef,
  };
}
