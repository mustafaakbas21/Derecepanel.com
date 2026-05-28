/** ESKİ otomatik-soru-kirpici.html pixel tarama motoru (port) */

export type ColumnMode = "single" | "double";

export type ScanColumn = { label: string; x0: number; width: number };

export type PixelBox = { y1: number; y2: number };

export function getPixelScanColumns(pageW: number, cs: number, mode: ColumnMode): ScanColumn[] {
  const gutter = Math.max(20, Math.round(28 * cs));
  const mid = Math.floor(pageW / 2);
  if (mode === "double") {
    return [
      { label: "sol", x0: 0, width: Math.max(1, mid - Math.floor(gutter / 2)) },
      {
        label: "sag",
        x0: Math.min(pageW - 1, mid + Math.ceil(gutter / 2)),
        width: Math.max(1, pageW - (mid + Math.ceil(gutter / 2))),
      },
    ];
  }
  return [{ label: "", x0: 0, width: pageW }];
}

export function findQuestionBoxesByPixels(
  ctx: CanvasRenderingContext2D,
  col: ScanColumn,
  pageH: number,
  cs: number
): PixelBox[] {
  const imageData = ctx.getImageData(col.x0, 0, col.width, pageH);
  const data = imageData.data;
  const xStep = 2;
  const sampledPerRow = Math.max(1, Math.ceil(col.width / xStep));
  const darkThreshold = Math.max(4, Math.floor(sampledPerRow * 0.015));
  const blankRunLimit = Math.max(40, Math.round(40 * cs));
  const padY = Math.round(15 * cs);
  const minBoxH = Math.round(60 * cs);
  const scanTop = Math.round(pageH * 0.08);
  const scanBottom = Math.round(pageH * 0.96);
  const boxes: PixelBox[] = [];

  let contentStart: number | null = null;
  let lastInkY: number | null = null;
  let blankRun = 0;

  function rowHasInk(y: number) {
    let dark = 0;
    const rowOffset = y * col.width * 4;
    for (let x = 0; x < col.width; x += xStep) {
      const idx = rowOffset + x * 4;
      const a = data[idx + 3];
      if (a < 24) continue;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const lum = r * 0.299 + g * 0.587 + b * 0.114;
      if (lum < 205) {
        dark++;
        if (dark > darkThreshold) return true;
      }
    }
    return false;
  }

  function pushBox(y1: number, y2: number) {
    const top = Math.max(0, y1 - padY);
    const bottom = Math.min(pageH, y2 + padY);
    if (bottom - top >= minBoxH) boxes.push({ y1: top, y2: bottom });
  }

  for (let y = scanTop; y < scanBottom; y++) {
    if (rowHasInk(y)) {
      if (contentStart === null) contentStart = y;
      lastInkY = y;
      blankRun = 0;
    } else if (contentStart !== null) {
      blankRun++;
      if (blankRun >= blankRunLimit) {
        pushBox(contentStart, lastInkY ?? y);
        contentStart = null;
        lastInkY = null;
        blankRun = 0;
      }
    }
  }

  if (contentStart !== null && lastInkY !== null) {
    pushBox(contentStart, lastInkY);
  }

  return boxes;
}

export function cropRegionFromCanvas(
  source: HTMLCanvasElement,
  col: ScanColumn,
  y1: number,
  y2: number
): string {
  const h = y2 - y1;
  const crop = document.createElement("canvas");
  crop.width = col.width;
  crop.height = h;
  const c = crop.getContext("2d")!;
  c.drawImage(source, col.x0, y1, col.width, h, 0, 0, col.width, h);
  return crop.toDataURL("image/png", 1);
}
