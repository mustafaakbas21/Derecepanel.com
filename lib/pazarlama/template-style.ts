import { PM_TPL_STYLE_KEY } from "./constants";
import type { StoryKind, TemplateStyleMap } from "./types";
import { safeParse } from "./utils";

import { panelGetItem, panelRemoveItem, panelSetItem } from "@/lib/panel-store";
export function styleChoicesFor(kind: StoryKind) {
  if (kind === "leaderboard") {
    return [
      { value: "1", label: "Stil 1 · Glassmorphism Liste" },
      { value: "2", label: "Stil 2 · Floating Cards" },
      { value: "3", label: "Stil 3 · Minimalist Kurumsal" },
    ];
  }
  if (kind === "star") {
    return [
      { value: "1", label: "Stil 1 · Polaroid Frame" },
      { value: "2", label: "Stil 2 · Devasa Tipografi" },
      { value: "3", label: "Stil 3 · Pastel Spotlight" },
    ];
  }
  return [
    { value: "1", label: "Stil 1 · Devasa Rakamlar" },
    { value: "2", label: "Stil 2 · Zen Progress" },
    { value: "3", label: "Stil 3 · Takvim Yaprağı" },
  ];
}

export function loadTemplateStyleMap(): TemplateStyleMap {
  return safeParse<TemplateStyleMap>(
    typeof window !== "undefined" ? panelGetItem(PM_TPL_STYLE_KEY) : null,
    {}
  );
}

export function saveTemplateStyleMap(map: TemplateStyleMap): void {
  try {
    panelSetItem(PM_TPL_STYLE_KEY, JSON.stringify(map || {}));
  } catch {
    /* ignore */
  }
}

export function resolveStyle(
  kind: StoryKind,
  wanted: string | undefined,
  styleMap: TemplateStyleMap
): string {
  const choices = styleChoicesFor(kind);
  const prev = styleMap[kind] || "";
  const desired = String(wanted || prev || "1");
  const ok = choices.some((c) => c.value === desired);
  const finalVal = ok ? desired : "1";
  styleMap[kind] = finalVal;
  saveTemplateStyleMap(styleMap);
  return finalVal;
}
