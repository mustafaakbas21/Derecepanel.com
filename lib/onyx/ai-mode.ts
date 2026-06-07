import type { OnyxActionType } from "@/lib/onyx/types";
import {
  isDecommissionedGroqModel,
  ONYX_MODEL_DEEP,
  ONYX_MODEL_FAST,
  ONYX_MODEL_VISION,
  resolveLegacyGroqModel,
} from "@/lib/onyx/groq-models";

/** Onyx hibrit model yönlendirme modu */
export type OnyxAiMode = "FAST" | "DEEP";

export {
  ONYX_MODEL_DEEP,
  ONYX_MODEL_FAST,
  ONYX_MODEL_VISION,
} from "@/lib/onyx/groq-models";

export function resolveOnyxVisionModel(): string {
  return resolveOnyxGroqModel({ hasImage: true, isDeepMode: false });
}

/** @deprecated ONYX_DECOMMISSIONED_GROQ_MODELS kullanın */
export const ONYX_DECOMMISSIONED_MODELS = [
  "llama-3.2-90b-vision-preview",
  "meta-llama/llama-4-maverick-17b-128e-instruct",
  "deepseek-r1-distill-llama-70b",
] as const;

export const ONYX_AI_MODE_LABELS: Record<
  OnyxAiMode,
  { short: string; full: string }
> = {
  FAST: {
    short: "⚡ Hızlı",
    full: "⚡ Hızlı Mod",
  },
  DEEP: {
    short: "🧠 Derin",
    full: "🧠 Derin Analiz Modu",
  },
};

/** Bu aksiyonlar otomatik Derin Analiz moduna geçer */
export const ONYX_DEEP_AUTO_ACTIONS: OnyxActionType[] = [
  "konu-ozet",
  "deneme-trend",
  "net-avcisi",
  "boss-savasi",
  "gunun-gorevleri",
  "acil-net-roketi",
  "hedef-net-yol-haritasi",
  "osym-zor-konular",
];

export function actionRequiresDeepMode(actionType: OnyxActionType): boolean {
  return ONYX_DEEP_AUTO_ACTIONS.includes(actionType);
}

/** Metin modu yönlendirici (vision hariç) */
export function resolveOnyxTargetModel(mode: OnyxAiMode = "FAST"): string {
  return resolveOnyxGroqModel({ hasImage: false, isDeepMode: mode === "DEEP" });
}

/** Akıllı Groq model seçici — vision öncelikli, sonra Derin, varsayılan Hızlı */
export function resolveOnyxGroqModel(options: {
  hasImage: boolean;
  isDeepMode: boolean;
}): string {
  if (options.hasImage) {
    return (
      applyOnyxModelEnvOverride(process.env.GROQ_MODEL_VISION) ??
      ONYX_MODEL_VISION
    );
  }
  if (options.isDeepMode) {
    return (
      applyOnyxModelEnvOverride(process.env.GROQ_MODEL_DEEP) ?? ONYX_MODEL_DEEP
    );
  }
  return applyOnyxModelEnvOverride(process.env.GROQ_MODEL) ?? ONYX_MODEL_FAST;
}

/** `.env` override — kaldırılmış model adları yok sayılır veya alias'a düşer */
export function applyOnyxModelEnvOverride(
  envValue: string | undefined
): string | undefined {
  const trimmed = envValue?.trim();
  if (!trimmed) return undefined;

  const legacy = resolveLegacyGroqModel(trimmed);
  if (legacy) return legacy;

  if (isDecommissionedGroqModel(trimmed)) return undefined;

  return trimmed;
}

export function normalizeOnyxAiMode(value: unknown): OnyxAiMode {
  return value === "DEEP" ? "DEEP" : "FAST";
}
