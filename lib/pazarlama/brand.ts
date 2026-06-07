import { PM_BRAND_KEY } from "./constants";
import type { BrandState } from "./types";
import { hexToRgbTriplet, initials, safeParse } from "./utils";
import { getKurumAdi } from "./kurum";

import { panelGetItem, panelRemoveItem, panelSetItem } from "@/lib/panel-store";
export const DEFAULT_BRAND: BrandState = {
  themeId: "lavender",
  bgFrom: "#f3e8ff",
  bgTo: "#ffedd5",
  cardBg: "rgba(255, 255, 255, 0.55)",
  textMain: "#312e81",
  textMuted: "rgba(49, 46, 129, 0.62)",
  accent: "#a78bfa",
  logoDataUrl: "",
};

export const PALETTE_PRESETS: Record<
  string,
  Omit<BrandState, "logoDataUrl"> & { themeId: string }
> = {
  lavender: {
    themeId: "lavender",
    bgFrom: "#f3e8ff",
    bgTo: "#ffedd5",
    cardBg: "rgba(255, 255, 255, 0.55)",
    textMain: "#312e81",
    textMuted: "rgba(49, 46, 129, 0.62)",
    accent: "#a78bfa",
  },
  mint: {
    themeId: "mint",
    bgFrom: "#d1fae5",
    bgTo: "#e0f2fe",
    cardBg: "rgba(255, 255, 255, 0.55)",
    textMain: "#064e3b",
    textMuted: "rgba(6, 78, 59, 0.62)",
    accent: "#2dd4bf",
  },
  roseSand: {
    themeId: "roseSand",
    bgFrom: "#fce7f3",
    bgTo: "#fef3c7",
    cardBg: "rgba(255, 255, 255, 0.55)",
    textMain: "#4c0519",
    textMuted: "rgba(76, 5, 25, 0.62)",
    accent: "#fb7185",
  },
  minimalIce: {
    themeId: "minimalIce",
    bgFrom: "#f8fafc",
    bgTo: "#f1f5f9",
    cardBg: "rgba(255, 255, 255, 0.55)",
    textMain: "#1e293b",
    textMuted: "rgba(30, 41, 59, 0.62)",
    accent: "#94a3b8",
  },
};

export function loadBrandState(): BrandState {
  const v = safeParse<Partial<BrandState>>(
    typeof window !== "undefined" ? panelGetItem(PM_BRAND_KEY) : null,
    DEFAULT_BRAND
  );
  return { ...DEFAULT_BRAND, ...v, logoDataUrl: v.logoDataUrl ?? "" };
}

export function saveBrandState(state: BrandState): void {
  try {
    panelSetItem(PM_BRAND_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function setLogoOnStory(logoDataUrl: string): void {
  const logoBox = document.getElementById("pm-logo");
  if (!logoBox) return;
  const img = logoBox.querySelector<HTMLImageElement>("#pm-logo-img");
  const fallback = logoBox.querySelector<HTMLElement>("#pm-logo-fallback");
  if (logoDataUrl) {
    if (img) {
      img.src = logoDataUrl;
      img.hidden = false;
      img.style.display = "block";
    }
    if (fallback) fallback.hidden = true;
  } else {
    if (img) {
      img.hidden = true;
      img.style.display = "none";
      img.removeAttribute("src");
    }
    if (fallback) fallback.hidden = false;
  }
}

export function syncBrandPreviewChip(brand: BrandState): void {
  const kurum = getKurumAdi();
  const nameEl = document.getElementById("pm-brandPreviewName");
  if (nameEl) nameEl.textContent = kurum;
  const fb = document.getElementById("pm-brandPreviewFallback");
  if (fb) fb.textContent = initials(kurum);
  const img = document.getElementById("pm-brandPreviewImg") as HTMLImageElement | null;
  const has = !!brand.logoDataUrl;
  if (img) {
    img.hidden = !has;
    if (has) {
      img.src = brand.logoDataUrl;
      img.style.display = "block";
    } else {
      img.style.display = "none";
      img.removeAttribute("src");
    }
  }
  if (fb) fb.hidden = has;
}

export function applyBrandToStory(brand: BrandState): void {
  const story = document.getElementById("pm-story-root");
  if (!story) return;
  story.style.setProperty("--bg-from", brand.bgFrom || DEFAULT_BRAND.bgFrom);
  story.style.setProperty("--bg-to", brand.bgTo || DEFAULT_BRAND.bgTo);
  story.style.setProperty("--card-bg", brand.cardBg || DEFAULT_BRAND.cardBg);
  story.style.setProperty("--text-main", brand.textMain || DEFAULT_BRAND.textMain);
  story.style.setProperty("--text-muted", brand.textMuted || DEFAULT_BRAND.textMuted);
  story.style.setProperty("--accent-color", brand.accent || DEFAULT_BRAND.accent);
  story.style.setProperty(
    "--accent-rgb",
    hexToRgbTriplet(brand.accent) || "167 139 250"
  );
  setLogoOnStory(brand.logoDataUrl || "");
  syncBrandPreviewChip(brand);
}
