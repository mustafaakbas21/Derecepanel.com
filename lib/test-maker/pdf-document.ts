import type { PDFDocumentProxy } from "pdfjs-dist";

import { PDF_MAX_BYTES } from "@/lib/test-maker/constants";
import { tmToast } from "@/lib/test-maker/notify";

let workerReady = false;
let renderGen = 0;

export async function initPdfJs() {
  const pdfjs = await import("pdfjs-dist");
  if (!workerReady) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    workerReady = true;
  }
  return pdfjs;
}

export async function loadPdfFromFile(file: File): Promise<PDFDocumentProxy> {
  if (file.size > PDF_MAX_BYTES) {
    tmToast.pdfTooBig();
    throw new Error("too_large");
  }
  const pdfjs = await initPdfJs();
  const buf = await file.arrayBuffer();
  return pdfjs.getDocument({ data: buf }).promise;
}

export type RenderPdfOptions = {
  pageIndex: number;
  zoom: number;
  maxWidth: number;
};

export type RenderPdfResult = {
  viewportWidth: number;
  viewportHeight: number;
  dpr: number;
  /** ESKİ pdfRenderFinalScale — fitScale * userZoom */
  renderFinalScale: number;
  renderGen: number;
};

/** ESKİ renderCurrentPdfPage — zoom CSS transform yok, PDF.js yeniden render */
export async function renderPdfPageToCanvas(
  doc: PDFDocumentProxy,
  canvas: HTMLCanvasElement,
  opts: RenderPdfOptions
): Promise<RenderPdfResult> {
  const myGen = ++renderGen;
  const page = await doc.getPage(opts.pageIndex);
  if (myGen !== renderGen) {
    return {
      viewportWidth: 0,
      viewportHeight: 0,
      dpr: 1,
      renderFinalScale: 1,
      renderGen: myGen,
    };
  }

  const rot = typeof page.rotate === "number" ? page.rotate : 0;
  const base = page.getViewport({ scale: 1, rotation: rot });
  const fitScale = Math.max(160, opts.maxWidth) / base.width;
  const finalScale = fitScale * opts.zoom;
  const viewport = page.getViewport({ scale: finalScale, rotation: rot });

  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const bufW = Math.max(1, Math.floor(viewport.width * dpr));
  const bufH = Math.max(1, Math.floor(viewport.height * dpr));

  if (canvas.width !== bufW) canvas.width = bufW;
  if (canvas.height !== bufH) canvas.height = bufH;

  canvas.style.width = `${Math.floor(viewport.width)}px`;
  canvas.style.height = `${Math.floor(viewport.height)}px`;

  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) {
    return {
      viewportWidth: viewport.width,
      viewportHeight: viewport.height,
      dpr,
      renderFinalScale: finalScale,
      renderGen: myGen,
    };
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, bufW, bufH);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, bufW, bufH);

  const renderOpts: {
    canvasContext: CanvasRenderingContext2D;
    viewport: typeof viewport;
    canvas: HTMLCanvasElement;
    transform?: number[];
  } = {
    canvasContext: ctx,
    viewport,
    canvas,
  };
  if (dpr !== 1) renderOpts.transform = [dpr, 0, 0, dpr, 0, 0];

  await page.render(renderOpts).promise;

  return {
    viewportWidth: viewport.width,
    viewportHeight: viewport.height,
    dpr,
    renderFinalScale: finalScale,
    renderGen: myGen,
  };
}

/** Otonom tarama için yüksek çözünürlüklü offscreen render */
export async function renderPdfPageOffscreen(
  doc: PDFDocumentProxy,
  pageIndex: number,
  displayScale = 1
): Promise<{ canvas: HTMLCanvasElement; cropScale: number }> {
  const page = await doc.getPage(pageIndex);
  const cropScale = Math.min(displayScale * 2, 3);
  const viewport = page.getViewport({ scale: cropScale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, viewport.width, viewport.height);
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  try {
    page.cleanup();
  } catch {
    /* ignore */
  }
  return { canvas, cropScale };
}
