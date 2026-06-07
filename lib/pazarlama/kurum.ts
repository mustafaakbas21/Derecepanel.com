import { KURUM_NAME_KEYS } from "./constants";
import { getKurumAdi as getInstitutionName } from "@/lib/exams/institution";

import { panelGetItem, panelRemoveItem, panelSetItem } from "@/lib/panel-store";
/** ESKİ pazarlama.js getKurumAdi — çoklu LS anahtarı + fallback */
export function getKurumAdi(): string {
  if (typeof window !== "undefined") {
    try {
      for (const key of KURUM_NAME_KEYS) {
        const v = panelGetItem(key);
        if (v && String(v).trim()) return String(v).trim();
      }
    } catch {
      /* ignore */
    }
    const title = document.querySelector(".coach-brand__title, .sidebar__title");
    if (title?.textContent?.trim()) return title.textContent.trim();
  }
  const inst = getInstitutionName();
  return inst && inst !== "DerecePanel Kurumu" ? inst : "Kurum";
}
