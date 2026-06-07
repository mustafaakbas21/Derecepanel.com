import { panelGetItem, panelRemoveItem, panelSetItem } from "@/lib/panel-store";
import {
  DEFAULT_TEMPLATE,
  getTemplateById,
  getTemplateName,
  resolveTemplateId,
  type TemplateDefinition,
} from "@/lib/test-maker/template-registry";
import type { TemplateId } from "@/lib/test-maker/types";

export {
  DEFAULT_TEMPLATE,
  getTemplateById,
  getTemplateName,
  resolveTemplateId,
  type TemplateDefinition,
};

const LAST_TEMPLATE_KEY = "tm_last_template_v1";

/** ESKİ applyTemplate — popover kart vurgusu + data-tpl yedek senkron */
export function applyTemplate(tpl: TemplateId, name: string) {
  if (typeof document === "undefined") return;

  const page = document.getElementById("tm-a4-page");
  if (page) page.setAttribute("data-tpl", tpl);

  const label = document.getElementById("tm-tpl-active-name");
  if (label) label.textContent = name;

  document.querySelectorAll(".tm-tpl-card").forEach((btn) => {
    const el = btn as HTMLElement;
    const isActive = el.getAttribute("data-tpl") === tpl;
    el.style.background = isActive ? "#f1f5f9" : "transparent";
    el.style.borderColor = isActive ? "#0f172a" : "transparent";
  });
}

export function templateDataAttributes(tpl: TemplateId) {
  return { "data-tpl": tpl } as const;
}

export function initDefaultTemplate() {
  applyTemplate(DEFAULT_TEMPLATE.id, DEFAULT_TEMPLATE.name);
}

export function loadLastTemplate(): { id: TemplateId; name: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = panelGetItem(LAST_TEMPLATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { id?: string; name?: string };
    const id = resolveTemplateId(parsed.id);
    return { id, name: parsed.name ?? getTemplateName(id) };
  } catch {
    return null;
  }
}

export function saveLastTemplate(id: TemplateId, name?: string) {
  if (typeof window === "undefined") return;
  try {
    panelSetItem(
      LAST_TEMPLATE_KEY,
      JSON.stringify({ id, name: name ?? getTemplateName(id) })
    );
  } catch {
    /* quota */
  }
}
