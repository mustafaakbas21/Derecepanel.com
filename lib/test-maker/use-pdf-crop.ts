"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

import {
  extractPdfRegionToDataUrl,
  type PdfRenderMeta,
} from "@/lib/test-maker/pdf-crop";
import { marqueeRectFromPoints } from "@/lib/test-maker/pdf-crop-coords";
import type { UsePdfDocumentReturn } from "@/lib/test-maker/use-pdf-document";
import { tmToast } from "@/lib/test-maker/notify";
import type { CropAnswerChoice } from "@/lib/test-maker/types";

type OnCropDone = (dataUrl: string, letter: CropAnswerChoice) => void;

export type PdfCropRefs = {
  overlayRef: RefObject<HTMLElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  wrapRef: RefObject<HTMLElement | null>;
};

const MARQUEE_HANDLES = [
  { l: "0%", t: "0%" },
  { l: "50%", t: "0%" },
  { l: "100%", t: "0%" },
  { l: "100%", t: "50%" },
  { l: "100%", t: "100%" },
  { l: "50%", t: "100%" },
  { l: "0%", t: "100%" },
  { l: "0%", t: "50%" },
] as const;

function getMarquee() {
  return document.getElementById("tm-pdf-crop-marquee");
}

function attachCropHandleDots(marquee: HTMLElement) {
  marquee.querySelectorAll(".tm-crop-hdl").forEach((n) => n.remove());
  MARQUEE_HANDLES.forEach((p) => {
    const h = document.createElement("span");
    h.className = "tm-crop-hdl";
    h.setAttribute("aria-hidden", "true");
    h.style.cssText =
      "pointer-events:none;position:absolute;z-index:2;width:8px;height:8px;transform:translate(-50%,-50%);border-radius:2px;border:1px solid #fff;background:#94a3b8;box-shadow:0 1px 2px rgba(0,0,0,0.2);";
    h.style.left = p.l;
    h.style.top = p.t;
    marquee.appendChild(h);
  });
}

function applyMarqueeRect(rect: {
  left: number;
  top: number;
  width: number;
  height: number;
}) {
  const mq = getMarquee();
  if (!mq) return;
  mq.style.display = "block";
  mq.style.left = `${rect.left}px`;
  mq.style.top = `${rect.top}px`;
  mq.style.width = `${rect.width}px`;
  mq.style.height = `${rect.height}px`;
}

export function usePdfCrop(
  pdf: UsePdfDocumentReturn,
  onCrop: OnCropDone,
  refs: PdfCropRefs
) {
  const [cropPressed, setCropPressed] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<CropAnswerChoice | null>(null);
  const [floaterOpen, setFloaterOpen] = useState(false);
  const [cropPreviewDataUrl, setCropPreviewDataUrl] = useState<string | null>(null);

  const drawingRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0 });
  const dragActiveRef = useRef(false);
  const cropPressedRef = useRef(cropPressed);
  const selectedLetterRef = useRef(selectedLetter);
  const floaterOpenRef = useRef(floaterOpen);
  const cropPreviewRef = useRef<string | null>(null);
  const renderMetaRef = useRef<PdfRenderMeta>({
    pageIndex: 1,
    renderFinalScale: 1,
    renderDpr: 1,
  });

  useEffect(() => {
    cropPressedRef.current = cropPressed;
  }, [cropPressed]);

  useEffect(() => {
    selectedLetterRef.current = selectedLetter;
  }, [selectedLetter]);

  useEffect(() => {
    floaterOpenRef.current = floaterOpen;
  }, [floaterOpen]);

  useEffect(() => {
    cropPreviewRef.current = cropPreviewDataUrl;
  }, [cropPreviewDataUrl]);

  const setRenderMeta = useCallback((meta: PdfRenderMeta) => {
    renderMetaRef.current = meta;
  }, []);

  const hideCropUi = useCallback(() => {
    drawingRef.current = false;
    dragActiveRef.current = false;
    setFloaterOpen(false);
    setSelectedLetter(null);
    selectedLetterRef.current = null;
    setCropPreviewDataUrl(null);
    cropPreviewRef.current = null;

    const marquee = getMarquee();
    if (marquee) {
      marquee.style.display = "none";
      marquee.style.left = "";
      marquee.style.top = "";
      marquee.style.width = "";
      marquee.style.height = "";
      marquee.querySelectorAll(".tm-crop-hdl").forEach((n) => n.remove());
    }
  }, []);

  const confirmCrop = useCallback(() => {
    if (!selectedLetterRef.current) return;
    const letter = selectedLetterRef.current;
    const preview = cropPreviewRef.current;
    hideCropUi();

    if (preview) {
      onCrop(preview, letter);
      return;
    }

    const marquee = getMarquee();
    const frozenRect = marquee ? marquee.getBoundingClientRect() : null;
    const canvas = refs.canvasRef.current;
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
  }, [hideCropUi, pdf.pdfDoc, onCrop, refs.canvasRef]);

  const extractCropPreview = useCallback(() => {
    const marquee = getMarquee();
    const frozenRect = marquee ? marquee.getBoundingClientRect() : null;
    const canvas = refs.canvasRef.current;
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
      if (dataUrl) {
        setCropPreviewDataUrl(dataUrl);
        cropPreviewRef.current = dataUrl;
      }
    });
  }, [pdf.pdfDoc, refs.canvasRef]);

  const finishDraw = useCallback(() => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    dragActiveRef.current = false;
    if (!cropPressedRef.current) return;

    const marquee = getMarquee();
    if (!marquee) return;
    const rw = parseFloat(marquee.style.width) || 0;
    const rh = parseFloat(marquee.style.height) || 0;
    if (rw < 12 || rh < 12) {
      hideCropUi();
      return;
    }

    attachCropHandleDots(marquee);
    setSelectedLetter(null);
    selectedLetterRef.current = null;
    setFloaterOpen(true);
    extractCropPreview();
  }, [hideCropUi, extractCropPreview]);

  useEffect(() => {
    if (!cropPressed) return;
    const overlay = refs.overlayRef.current;
    if (!overlay) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!cropPressedRef.current || !pdf.pdfDoc || e.button !== 0) return;

      const marquee = getMarquee();
      if (
        floaterOpenRef.current &&
        marquee &&
        marquee.style.display !== "none"
      ) {
        const ml = parseFloat(marquee.style.left) || 0;
        const mt = parseFloat(marquee.style.top) || 0;
        const mw = parseFloat(marquee.style.width) || 0;
        const mh = parseFloat(marquee.style.height) || 0;
        if (
          e.offsetX >= ml &&
          e.offsetX <= ml + mw &&
          e.offsetY >= mt &&
          e.offsetY <= mt + mh
        ) {
          return;
        }
      }

      e.preventDefault();
      e.stopPropagation();

      hideCropUi();
      drawingRef.current = true;
      dragActiveRef.current = true;

      startRef.current = { x: e.offsetX, y: e.offsetY };
      applyMarqueeRect(marqueeRectFromPoints(startRef.current, startRef.current));

      try {
        overlay.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!drawingRef.current) return;
      const current = { x: e.offsetX, y: e.offsetY };
      applyMarqueeRect(marqueeRectFromPoints(startRef.current, current));
    };

    const onPointerUp = (e: PointerEvent) => {
      try {
        if (overlay.hasPointerCapture(e.pointerId)) {
          overlay.releasePointerCapture(e.pointerId);
        }
      } catch {
        /* ignore */
      }
      finishDraw();
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
  }, [cropPressed, pdf.pdfDoc, hideCropUi, finishDraw, refs.overlayRef]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && floaterOpenRef.current) {
        e.preventDefault();
        hideCropUi();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [hideCropUi]);

  const toggleCrop = useCallback(() => {
    setCropPressed((on) => {
      hideCropUi();
      return !on;
    });
  }, [hideCropUi]);

  return {
    cropPressed,
    setCropPressed,
    toggleCrop,
    selectedLetter,
    setSelectedLetter,
    floaterOpen,
    cropPreviewDataUrl,
    hideCropUi,
    confirmCrop,
    setRenderMeta,
    dragActiveRef,
  };
}
