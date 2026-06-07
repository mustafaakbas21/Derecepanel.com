import { CURRENT_USER_KEY } from "@/lib/appointments/constants";
import type { CurrentUser } from "@/lib/appointments/types";

import { panelGetItem, panelRemoveItem, panelSetItem } from "@/lib/panel-store";
export function getCurrentUser(): CurrentUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = panelGetItem(CURRENT_USER_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw) as CurrentUser;
    return u && typeof u === "object" ? u : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: CurrentUser) {
  if (typeof window === "undefined") return;
  panelSetItem(CURRENT_USER_KEY, JSON.stringify(user));
}
