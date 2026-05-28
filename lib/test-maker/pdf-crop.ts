import type { PDFDocumentProxy } from "pdfjs-dist";

export type FrozenRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type PdfRenderMeta = {
  pageIndex: number;
  renderFinalScale: number;
  renderDpr: number;
};

/** ESKİ fallbackCrop — doğrudan source canvas buffer */
export function fallbackCropFromCanvas(
  sourceCanvas: HTMLCanvasElement,
  frozenMarqueeRect: FrozenRect
): string | null {
  const canvasRect = sourceCanvas.getBoundingClientRect();
  const scaleX = sourceCanvas.width / canvasRect.width;
  const scaleY = sourceCanvas.height / canvasRect.height;

  const sourceX = (frozenMarqueeRect.left - canvasRect.left) * scaleX;
  const sourceY = (frozenMarqueeRect.top - canvasRect.top) * scaleY;
  const sourceWidth = frozenMarqueeRect.width * scaleX;
  const sourceHeight = frozenMarqueeRect.height * scaleY;

  const finalX = Math.max(0, Math.min(sourceX, sourceCanvas.width));
  const finalY = Math.max(0, Math.min(sourceY, sourceCanvas.height));
  const finalWidth = Math.max(4, Math.min(sourceWidth, sourceCanvas.width - finalX));
  const finalHeight = Math.max(4, Math.min(sourceHeight, sourceCanvas.height - finalY));

  if (finalWidth < 4 || finalHeight < 4) return null;

  try {
    const fb = document.createElement("canvas");
    fb.width = Math.floor(finalWidth);
    fb.height = Math.floor(finalHeight);
    const fc = fb.getContext("2d");
    if (!fc) return null;
    fc.imageSmoothingEnabled = true;
    fc.imageSmoothingQuality = "high";
    fc.drawImage(
      sourceCanvas,
      finalX,
      finalY,
      finalWidth,
      finalHeight,
      0,
      0,
      fb.width,
      fb.height
    );
    return fb.toDataURL("image/png", 1.0);
  } catch {
    return null;
  }
}

/**
 * ESKİ extractPdfRegionToDataUrlExt — HI_SCALE=3 PDF.js re-render + crop
 */
export function extractPdfRegionToDataUrlExt(
  frozenMarqueeRect: FrozenRect | DOMRect | null,
  sourceCanvas: HTMLCanvasElement | null,
  pdfDoc: PDFDocumentProxy | null,
  pageIndex: number,
  renderFinalScale: number,
  renderDpr: number
): Promise<string | null> {
  return new Promise((resolve) => {
    if (!sourceCanvas || !pdfDoc) {
      resolve(null);
      return;
    }
    if (
      sourceCanvas.id === "tm-pdf-canvas" &&
      sourceCanvas.classList.contains("hidden")
    ) {
      resolve(null);
      return;
    }
    if (
      !frozenMarqueeRect ||
      frozenMarqueeRect.width < 4 ||
      frozenMarqueeRect.height < 4
    ) {
      resolve(null);
      return;
    }

    const canvasRect = sourceCanvas.getBoundingClientRect();
    const scaleX = sourceCanvas.width / canvasRect.width;
    const scaleY = sourceCanvas.height / canvasRect.height;

    const sourceX = (frozenMarqueeRect.left - canvasRect.left) * scaleX;
    const sourceY = (frozenMarqueeRect.top - canvasRect.top) * scaleY;
    const sourceWidth = frozenMarqueeRect.width * scaleX;
    const sourceHeight = frozenMarqueeRect.height * scaleY;

    const finalX = Math.max(0, Math.min(sourceX, sourceCanvas.width));
    const finalY = Math.max(0, Math.min(sourceY, sourceCanvas.height));
    const finalWidth = Math.max(4, Math.min(sourceWidth, sourceCanvas.width - finalX));
    const finalHeight = Math.max(4, Math.min(sourceHeight, sourceCanvas.height - finalY));

    if (finalWidth < 4 || finalHeight < 4) {
      resolve(null);
      return;
    }

    let totalRenderScale = (renderFinalScale || 1) * (renderDpr || 1);
    if (totalRenderScale <= 0) totalRenderScale = 1;

    const pdfLeft = finalX / totalRenderScale;
    const pdfTop = finalY / totalRenderScale;
    const pdfWidth = finalWidth / totalRenderScale;
    const pdfHeight = finalHeight / totalRenderScale;

    const HI_SCALE = 3.0;

    const fallback = () => resolve(fallbackCropFromCanvas(sourceCanvas, frozenMarqueeRect));

    pdfDoc
      .getPage(pageIndex)
      .then((page) => {
        const rot = typeof page.rotate === "number" ? page.rotate : 0;
        const hiViewport = page.getViewport({ scale: HI_SCALE, rotation: rot });

        const hiCanvas = document.createElement("canvas");
        hiCanvas.width = Math.ceil(hiViewport.width);
        hiCanvas.height = Math.ceil(hiViewport.height);

        const hiCtx = hiCanvas.getContext("2d", { alpha: false });
        if (!hiCtx) {
          fallback();
          return;
        }
        hiCtx.fillStyle = "#ffffff";
        hiCtx.fillRect(0, 0, hiCanvas.width, hiCanvas.height);

        return page
          .render({ canvasContext: hiCtx, viewport: hiViewport, canvas: hiCanvas })
          .promise.then(() => {
            let hx = Math.floor(pdfLeft * HI_SCALE);
            let hy = Math.floor(pdfTop * HI_SCALE);
            let hw = Math.ceil(pdfWidth * HI_SCALE);
            let hh = Math.ceil(pdfHeight * HI_SCALE);

            hx = Math.max(0, Math.min(hx, hiCanvas.width));
            hy = Math.max(0, Math.min(hy, hiCanvas.height));
            hw = Math.max(4, Math.min(hw, hiCanvas.width - hx));
            hh = Math.max(4, Math.min(hh, hiCanvas.height - hy));

            const cropCanvas = document.createElement("canvas");
            cropCanvas.width = hw;
            cropCanvas.height = hh;

            const ctx = cropCanvas.getContext("2d");
            if (!ctx) {
              fallback();
              return;
            }
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(hiCanvas, hx, hy, hw, hh, 0, 0, hw, hh);

            try {
              resolve(cropCanvas.toDataURL("image/png", 1.0));
            } catch {
              fallback();
            }
          });
      })
      .catch(() => fallback());
  });
}

/** Sağ panel inline kırpma — mevcut render meta ile */
export function extractPdfRegionToDataUrl(
  frozenMarqueeRect: FrozenRect | DOMRect | null,
  sourceCanvas: HTMLCanvasElement | null,
  pdfDoc: PDFDocumentProxy | null,
  meta: PdfRenderMeta
): Promise<string | null> {
  return extractPdfRegionToDataUrlExt(
    frozenMarqueeRect,
    sourceCanvas,
    pdfDoc,
    meta.pageIndex,
    meta.renderFinalScale,
    meta.renderDpr
  );
}

/** @deprecated use extractPdfRegionToDataUrl */
export function cropCanvasRegion(
  sourceCanvas: HTMLCanvasElement,
  rect: DOMRect | FrozenRect
): string | null {
  return fallbackCropFromCanvas(sourceCanvas, rect);
}
