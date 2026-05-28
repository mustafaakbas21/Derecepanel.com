"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";

import { loadPdfFromFile, renderPdfPageToCanvas } from "@/lib/test-maker/pdf-document";
import type { PdfRenderMeta } from "@/lib/test-maker/pdf-crop";
import { tmToast } from "@/lib/test-maker/notify";

export type PdfFileEntry = { id: string; name: string; doc: PDFDocumentProxy };

export function usePdfDocument() {
  const [files, setFiles] = useState<PdfFileEntry[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [panMode, setPanMode] = useState(false);
  const [cropMode, setCropMode] = useState(false);
  const [renderGen, setRenderGen] = useState(0);
  const renderTaskRef = useRef(0);
  const renderMetaRef = useRef<PdfRenderMeta>({
    pageIndex: 1,
    renderFinalScale: 1,
    renderDpr: 1,
  });

  const activeFile = files.find((f) => f.id === activeFileId) ?? null;
  const pdfDoc = activeFile?.doc ?? null;
  const totalPages = pdfDoc?.numPages ?? 0;
  const fileName = activeFile?.name ?? null;

  const loadFile = useCallback(async (file: File) => {
    try {
      const doc = await loadPdfFromFile(file);
      const id = `pdf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setFiles((prev) => [...prev, { id, name: file.name, doc }]);
      setActiveFileId(id);
      setPageIndex(1);
      setPanX(0);
      setPanY(0);
      setRenderGen((g) => g + 1);
    } catch (e) {
      if ((e as Error).message !== "too_large") {
        tmToast.pdfError("PDF yüklenemedi");
      }
    }
  }, []);

  const loadFiles = useCallback(
    async (list: FileList | File[]) => {
      for (const f of Array.from(list)) {
        if (f.type === "application/pdf") await loadFile(f);
      }
    },
    [loadFile]
  );

  const updateCanvasHost = useCallback((canvas: HTMLCanvasElement) => {
    const host = document.getElementById("tm-canvas-size-host");
    const sWrap = document.getElementById("tm-canvas-scale-wrap");
    if (!host || !sWrap) return;
    sWrap.style.transform = "none";
    if (canvas.classList.contains("hidden")) {
      host.style.width = "1px";
      host.style.height = "1px";
      return;
    }
    const nw = parseFloat(canvas.style.width) || canvas.offsetWidth || 0;
    const nh = parseFloat(canvas.style.height) || canvas.offsetHeight || 0;
    host.style.width = `${Math.round(nw)}px`;
    host.style.height = `${Math.round(nh)}px`;
  }, []);

  const renderToCanvas = useCallback(
    async (canvas: HTMLCanvasElement, maxWidth: number, page = pageIndex) => {
      if (!pdfDoc) return null;
      const taskId = ++renderTaskRef.current;
      const result = await renderPdfPageToCanvas(pdfDoc, canvas, {
        pageIndex: page,
        zoom,
        maxWidth,
      });
      if (taskId !== renderTaskRef.current) return null;

      canvas.classList.remove("hidden");
      renderMetaRef.current = {
        pageIndex: page,
        renderFinalScale: result.renderFinalScale,
        renderDpr: result.dpr,
      };
      updateCanvasHost(canvas);
      return result;
    },
    [pdfDoc, pageIndex, zoom, updateCanvasHost]
  );

  const getRenderMeta = useCallback(() => ({ ...renderMetaRef.current }), []);

  const bumpRender = useCallback(() => setRenderGen((g) => g + 1), []);

  useEffect(() => {
    if (totalPages > 0 && pageIndex > totalPages) {
      setPageIndex(totalPages);
    }
  }, [totalPages, pageIndex]);

  const commitPageInput = (raw: string) => {
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || totalPages === 0) return;
    setPageIndex(Math.max(1, Math.min(totalPages, n)));
    bumpRender();
  };

  const selectFile = (id: string) => {
    setActiveFileId(id);
    setPageIndex(1);
    setPanX(0);
    setPanY(0);
    bumpRender();
  };

  const resetPan = useCallback(() => {
    setPanX(0);
    setPanY(0);
  }, []);

  return {
    files,
    activeFileId,
    selectFile,
    fileName,
    pdfDoc,
    pageIndex,
    setPageIndex: (n: number) => {
      setPageIndex(n);
      bumpRender();
    },
    totalPages,
    zoom,
    setZoom: (z: number) => {
      setZoom(z);
      bumpRender();
    },
    panX,
    panY,
    setPan: (x: number, y: number) => {
      setPanX(x);
      setPanY(y);
    },
    resetPan,
    panMode,
    setPanMode: (v: boolean) => setPanMode(v),
    cropMode,
    setCropMode: (v: boolean) => setCropMode(v),
    renderGen,
    bumpRender,
    loadFile,
    loadFiles,
    renderToCanvas,
    getRenderMeta,
    commitPageInput,
    hasPdf: Boolean(pdfDoc),
  };
}

export type UsePdfDocumentReturn = ReturnType<typeof usePdfDocument>;
