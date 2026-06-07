import { panelGetItem, panelRemoveItem, panelSetItem } from "@/lib/panel-store";
export function getKurumAdi(): string {
  if (typeof window !== "undefined") {
    try {
      const raw = panelGetItem("derecepanel_institution_name");
      if (raw) return raw;
    } catch {
      /* ignore */
    }
  }
  return "DerecePanel Kurumu";
}
