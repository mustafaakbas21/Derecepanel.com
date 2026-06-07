import { STORY_HEIGHT, STORY_WIDTH } from "./constants";

/** ESKİ computePreviewScale — önizleme scale, export etkilemez */
export function computePreviewScale(): number {
  const canvasBox = document.getElementById("pm-canvas");
  const inner = document.getElementById("pm-preview-inner");
  const label = document.getElementById("pm-preview-scale");
  if (!canvasBox || !inner) return 1;

  const boxW = canvasBox.clientWidth;
  const boxH = canvasBox.clientHeight;
  if (!boxW || !boxH) return 1;

  const sw = boxW / STORY_WIDTH;
  const sh = boxH / STORY_HEIGHT;
  let s = Math.min(sw, sh, 1);
  s = Math.max(0.15, s);

  canvasBox.style.position = "relative";
  inner.style.position = "absolute";
  inner.style.left = "50%";
  inner.style.top = "50%";
  inner.style.transformOrigin = "center center";
  inner.style.transform = `translate(-50%, -50%) scale(${s.toFixed(4)})`;
  if (label) label.textContent = `Ölçek: %${Math.round(s * 100)}`;
  return s;
}
