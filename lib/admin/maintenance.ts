import { panelGetItem, panelSetItem } from "@/lib/panel-store";

export const MAINTENANCE_KEY = "maintenance_mode";

export const MAINTENANCE_BLOCK_MESSAGE =
  "Sistem bakımda. Lütfen daha sonra tekrar deneyin.";

export function isMaintenanceMode(): boolean {
  if (typeof window === "undefined") return false;
  return panelGetItem(MAINTENANCE_KEY) === "true";
}

export function setMaintenanceModeLocal(enabled: boolean): void {
  if (typeof window === "undefined") return;
  panelSetItem(MAINTENANCE_KEY, enabled ? "true" : "false");
}
