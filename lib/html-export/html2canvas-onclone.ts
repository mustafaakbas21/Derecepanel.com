/** html2canvas 1.x — lab()/oklch()/color-mix() desteklemez; klon üzerinde rgb'ye düzleştir */

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
] as const;

const UNSAFE_COLOR = /lab\(|oklch\(|color-mix\(/i;

function resolveToRgb(raw: string, view: Window, doc: Document): string {
  if (!raw || raw === "transparent") return raw;
  if (!UNSAFE_COLOR.test(raw)) return raw;

  const probe = doc.createElement("span");
  probe.style.color = raw;
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  doc.body.appendChild(probe);
  const rgb = view.getComputedStyle(probe).color;
  probe.remove();
  return rgb && !UNSAFE_COLOR.test(rgb) ? rgb : "#000000";
}

/** Klon belgedeki modern CSS renklerini inline rgb'ye çevirir */
export function flattenModernColorsInClone(clonedDoc: Document): void {
  const view = clonedDoc.defaultView;
  const body = clonedDoc.body;
  if (!view || !body) return;

  clonedDoc.querySelectorAll("style").forEach((node) => {
    const text = node.textContent;
    if (!text || !UNSAFE_COLOR.test(text)) return;
    node.textContent = text
      .replace(/lab\([^)]*\)/gi, "#ffffff")
      .replace(/oklch\([^)]*\)/gi, "#ffffff")
      .replace(/color-mix\([^)]*\)/gi, "#e2e8f0");
  });

  body.querySelectorAll("*").forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    const cs = view.getComputedStyle(node);
    for (const prop of COLOR_PROPS) {
      const raw = cs.getPropertyValue(prop);
      if (!raw || !UNSAFE_COLOR.test(raw)) continue;
      node.style.setProperty(prop, resolveToRgb(raw, view, clonedDoc));
    }
  });
}

export const HTML2CANVAS_SAFE_ONCLONE = (clonedDoc: Document) => {
  flattenModernColorsInClone(clonedDoc);
};
