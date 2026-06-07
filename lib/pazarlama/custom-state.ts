import { PM_CUSTOM_KEY } from "./constants";
import type { CountdownCustomState } from "./types";
import { safeParse } from "./utils";

import { panelGetItem, panelRemoveItem, panelSetItem } from "@/lib/panel-store";
export const DEFAULT_CUSTOM_STATE: CountdownCustomState = {
  targetDate: "",
  headline: "YKS'YE",
  subMsg: "Kaldı. Hazırsın.",
  quote: "Bugün çalış, yarın gurur duy.",
  totalDays: 365,
};

export function loadCustomState(): CountdownCustomState {
  return {
    ...DEFAULT_CUSTOM_STATE,
    ...safeParse<Partial<CountdownCustomState>>(
      typeof window !== "undefined" ? panelGetItem(PM_CUSTOM_KEY) : null,
      DEFAULT_CUSTOM_STATE
    ),
  };
}

export function saveCustomState(state: CountdownCustomState): void {
  try {
    panelSetItem(PM_CUSTOM_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}
