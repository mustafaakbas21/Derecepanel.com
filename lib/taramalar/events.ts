import {
  FASCICLE_ASSIGNED_EVENT,
  FASCICLE_RESULT_EVENT,
  TARAMA_ANALIZ_CHANGE,
  TARAMA_DEPO_CHANGE,
} from "@/lib/taramalar/constants";

export function dispatchTaramaAnalizChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TARAMA_ANALIZ_CHANGE));
}

export function dispatchTaramaDepoChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TARAMA_DEPO_CHANGE));
}

export function dispatchFascicleAssigned() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(FASCICLE_ASSIGNED_EVENT));
}

export function dispatchFascicleResult() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(FASCICLE_RESULT_EVENT));
}
