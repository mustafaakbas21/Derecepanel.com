/** html2canvas 1.x — lab()/oklab()/oklch()/color-mix() desteklemez; rgb'ye düzleştir */

const COLOR_PROPS = [
  "color",
  "background-color",
  "border-color",
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
  "outline-color",
  "text-decoration-color",
  "column-rule-color",
  "caret-color",
  "fill",
  "stroke",
] as const;

const SHORTHAND_COLOR_PROPS = ["background", "border", "outline", "box-shadow"] as const;

/** html2canvas'ın parse edemediği modern renk fonksiyonları */
export const UNSAFE_COLOR_FN = /(?:oklab|oklch|lab|lch|hwb|color-mix)\(/i;

/** CSS metnindeki modern renk fonksiyonlarını güvenli hex ile değiştirir */
export function stripModernColorFunctions(css: string): string {
  return css
    .replace(/oklab\([^)]*\)/gi, "#0f172a")
    .replace(/oklch\([^)]*\)/gi, "#0f172a")
    .replace(/lab\([^)]*\)/gi, "#0f172a")
    .replace(/lch\([^)]*\)/gi, "#0f172a")
    .replace(/hwb\([^)]*\)/gi, "#0f172a")
    .replace(/color-mix\([^)]*\)/gi, "#e2e8f0");
}

function resolveToRgb(raw: string, view: Window, doc: Document): string {
  if (!raw || raw === "transparent" || raw === "inherit" || raw === "currentcolor") {
    return raw;
  }
  if (!UNSAFE_COLOR_FN.test(raw)) return raw;

  const probe = doc.createElement("span");
  probe.style.color = raw;
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  doc.body.appendChild(probe);
  const rgb = view.getComputedStyle(probe).color;
  probe.remove();
  return rgb && !UNSAFE_COLOR_FN.test(rgb) ? rgb : "#0f172a";
}

function flattenStyleTags(doc: Document): void {
  doc.querySelectorAll("style").forEach((node) => {
    const text = node.textContent;
    if (!text || !UNSAFE_COLOR_FN.test(text)) return;
    node.textContent = stripModernColorFunctions(text);
  });
}

function flattenElementColors(root: ParentNode, view: Window, doc: Document): void {
  root.querySelectorAll("*").forEach((node) => {
    if (!(node instanceof HTMLElement) && !(node instanceof SVGElement)) return;
    const cs = view.getComputedStyle(node);
    for (const prop of COLOR_PROPS) {
      const raw = cs.getPropertyValue(prop);
      if (!raw || !UNSAFE_COLOR_FN.test(raw)) continue;
      (node as HTMLElement).style.setProperty(prop, resolveToRgb(raw, view, doc));
    }
    for (const prop of SHORTHAND_COLOR_PROPS) {
      const raw = cs.getPropertyValue(prop);
      if (!raw || !UNSAFE_COLOR_FN.test(raw)) continue;
      (node as HTMLElement).style.setProperty(prop, resolveToRgb(raw, view, doc));
    }
  });
}

/** Klon belgedeki modern CSS renklerini inline rgb'ye çevirir */
export function flattenModernColorsInClone(clonedDoc: Document): void {
  const view = clonedDoc.defaultView;
  const body = clonedDoc.body;
  if (!view || !body) return;

  flattenStyleTags(clonedDoc);
  flattenElementColors(body, view, clonedDoc);
}

/**
 * html2pdf öncesi ana belgedeki <style> etiketlerini geçici düzleştirir.
 * Tailwind v4 (oklab) → html2canvas hatasını önler.
 */
export function patchDocumentStylesForHtml2Canvas(doc: Document = document): () => void {
  const backups = new Map<HTMLStyleElement, string>();

  doc.querySelectorAll("style").forEach((node) => {
    if (!(node instanceof HTMLStyleElement)) return;
    const text = node.textContent;
    if (!text || !UNSAFE_COLOR_FN.test(text)) return;
    backups.set(node, text);
    node.textContent = stripModernColorFunctions(text);
  });

  return () => {
    backups.forEach((text, node) => {
      node.textContent = text;
    });
  };
}

export const HTML2CANVAS_SAFE_ONCLONE = (_clonedDoc: Document, clonedElement?: HTMLElement) => {
  const doc = clonedElement?.ownerDocument ?? _clonedDoc;
  flattenModernColorsInClone(doc);
};
