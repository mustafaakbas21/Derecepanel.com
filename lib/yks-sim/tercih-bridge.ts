import type { TercihFromPuanPayload } from "@/lib/yks-sim/types";
import { TERCİH_FROM_PUAN_KEY } from "@/lib/yks-sim/student-sim-bridge";

import { panelGetItem, panelRemoveItem, panelSetItem } from "@/lib/panel-store";
export { TERCİH_FROM_PUAN_KEY };

export function saveTercihFromPuanPayload(payload: Omit<TercihFromPuanPayload, "v" | "ts">) {
  if (typeof window === "undefined") return;
  const full: TercihFromPuanPayload = {
    v: 1,
    ts: Date.now(),
    ...payload,
  };
  panelSetItem(TERCİH_FROM_PUAN_KEY, JSON.stringify(full));
}

export function consumeTercihFromPuanPayload(): TercihFromPuanPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = panelGetItem(TERCİH_FROM_PUAN_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as TercihFromPuanPayload;
    panelRemoveItem(TERCİH_FROM_PUAN_KEY);
    return o?.v === 1 ? o : null;
  } catch {
    panelRemoveItem(TERCİH_FROM_PUAN_KEY);
    return null;
  }
}
