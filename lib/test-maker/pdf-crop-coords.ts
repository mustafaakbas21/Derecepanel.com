export function marqueeRectFromPoints(
  start: { x: number; y: number },
  current: { x: number; y: number }
): { left: number; top: number; width: number; height: number } {
  return {
    left: Math.min(start.x, current.x),
    top: Math.min(start.y, current.y),
    width: Math.abs(current.x - start.x),
    height: Math.abs(current.y - start.y),
  };
}

/** Fare → page-local (0 … pageRect.width/height); sınır = getBoundingClientRect */
export function pointerToPageLocal(
  clientX: number,
  clientY: number,
  pageEl: HTMLElement
): { x: number; y: number } {
  const pageRect = pageEl.getBoundingClientRect();
  const rawX = clientX - pageRect.left;
  const rawY = clientY - pageRect.top;
  return {
    x: Math.max(0, Math.min(rawX, pageRect.width)),
    y: Math.max(0, Math.min(rawY, pageRect.height)),
  };
}

/** Marquee pan-inner içindeyken: fare → pan-inner local; sınır = pageEl gerçek boyutu */
export function clampPointerToPageInPan(
  clientX: number,
  clientY: number,
  pageEl: HTMLElement,
  panInner: HTMLElement
): { x: number; y: number } {
  const pageRect = pageEl.getBoundingClientRect();
  const panRect = panInner.getBoundingClientRect();
  const offX = pageRect.left - panRect.left;
  const offY = pageRect.top - panRect.top;
  const rawX = clientX - panRect.left;
  const rawY = clientY - panRect.top;
  return {
    x: Math.max(offX, Math.min(rawX, offX + pageRect.width)),
    y: Math.max(offY, Math.min(rawY, offY + pageRect.height)),
  };
}

/** @deprecated host-local — pointerToPageLocal(pageHost) kullan */
export function clampPointerToPage(
  clientX: number,
  clientY: number,
  _canvas: HTMLCanvasElement,
  pageEl: HTMLElement
): { x: number; y: number } {
  return pointerToPageLocal(clientX, clientY, pageEl);
}

export function syncHostToCanvas(host: HTMLElement, canvas: HTMLCanvasElement) {
  const nw = parseFloat(canvas.style.width) || canvas.offsetWidth || 0;
  const nh = parseFloat(canvas.style.height) || canvas.offsetHeight || 0;
  host.style.width = `${Math.round(nw)}px`;
  host.style.height = `${Math.round(nh)}px`;
}
