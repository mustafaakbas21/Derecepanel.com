import type { StoryKind } from "./types";

export const PM_BRAND_KEY = "pm_brand_v2";
export const PM_TEXT_KEY = "pm_text_v2";
export const PM_CUSTOM_KEY = "pm_custom_v2";
export const PM_TPL_STYLE_KEY = "pm_tpl_style_v1";

export const STORY_WIDTH = 1080;
export const STORY_HEIGHT = 1920;

export const PAZARLAMA_ROUTE = "/dashboard/pazarlama";

export const TEMPLATE_OPTIONS: { value: StoryKind; label: string }[] = [
  { value: "leaderboard", label: "Liderlik Tablosu (İlk 10)" },
  { value: "star", label: "Haftanın Yıldızı" },
  { value: "countdown", label: "Sınav Motivasyonu / Geri Sayım" },
];

export const KURUM_NAME_KEYS = [
  "derecepanel_kurum_adi",
  "kurumAdi",
  "tm-brief-kurum",
  "kurum_adi",
  "derecepanel_institution_name",
] as const;
