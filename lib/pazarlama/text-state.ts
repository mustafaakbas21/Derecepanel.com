import { PM_TEXT_KEY } from "./constants";
import type { TextState } from "./types";
import { safeParse } from "./utils";

import { panelGetItem, panelRemoveItem, panelSetItem } from "@/lib/panel-store";
export const DEFAULT_TEXT_STATE: TextState = {
  leaderboard: {
    title: "İlk 10",
    badge: "TOP 10",
    boardTitle: "LİDERLİK TABLOSU",
    metric: "Toplam Net",
    footRight: "derecepanel",
  },
  star: {
    badge: "SPOTLIGHT",
    kickerBase: "GEÇEN SINAV",
    kickerEmpty: "GEÇEN SINAV VERİSİ YOK",
    title: "Haftanın Yıldızı",
    sub: "Netini en çok artıran öğrencimiz!",
  },
  countdown: {
    badge: "MOTİVASYON",
    label: "YKS'YE",
    subMsg: "Kaldı. Hazırsın.",
    quote: "Bugün çalış, yarın gurur duy.",
    totalDays: 365,
    footLeft: "Şablon: Geri Sayım",
  },
};

export function loadTextState(): TextState {
  const v = safeParse<Partial<TextState>>(
    typeof window !== "undefined" ? panelGetItem(PM_TEXT_KEY) : null,
    DEFAULT_TEXT_STATE
  );
  return {
    leaderboard: { ...DEFAULT_TEXT_STATE.leaderboard, ...v.leaderboard },
    star: { ...DEFAULT_TEXT_STATE.star, ...v.star },
    countdown: { ...DEFAULT_TEXT_STATE.countdown, ...v.countdown },
  };
}

export function saveTextState(state: TextState): void {
  try {
    panelSetItem(PM_TEXT_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}
