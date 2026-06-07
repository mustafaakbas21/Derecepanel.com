import { STORAGE_KEYS, TARAMA_DB } from "@/lib/test-maker/constants";

export { STORAGE_KEYS, TARAMA_DB };

export const TARAMA_LS = {
  examResults: "tarama_exam_results_v1",
  taramaDataPrefix: "tarama_data_",
} as const;

export const TARAMA_ANALIZ_CHANGE = "taramaAnaliz:change";
export const TARAMA_DEPO_CHANGE = "taramaDepo:change";
export const FASCICLE_ASSIGNED_EVENT = "derece:fascicle-assigned";
export const FASCICLE_RESULT_EVENT = "derece:fascicle-result";
