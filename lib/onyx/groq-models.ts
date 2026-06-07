/**
 * Groq model kayıtları — tek kaynak (Onyx).
 * Güncelleme: https://console.groq.com/docs/models · deprecations
 */

/** Hızlı metin — düşük gecikme */
export const ONYX_MODEL_FAST = "llama-3.3-70b-versatile";

/** Derin analiz — metin (matematik / mantık) */
export const ONYX_MODEL_DEEP = "llama-3.3-70b-versatile";

/** Görsel / multimodal soru çözümü */
export const ONYX_MODEL_VISION = "meta-llama/llama-4-scout-17b-16e-instruct";

/** İsteğe bağlı derin alternatif (env GROQ_MODEL_DEEP override) */
export const ONYX_MODEL_DEEP_ALT = ONYX_MODEL_DEEP;

/** Groq json_schema / Structured Outputs — hızlı */
export const ONYX_MODEL_STRUCTURED = "llama-3.3-70b-versatile";

/** Groq json_schema / Structured Outputs — derin (skill, kariyer, strateji) */
export const ONYX_MODEL_STRUCTURED_DEEP = ONYX_MODEL_DEEP_ALT;

/** https://console.groq.com/docs/structured-outputs#supported-models */
export const ONYX_GROQ_STRUCTURED_OUTPUT_MODELS = [
  ONYX_MODEL_STRUCTURED,
  ONYX_MODEL_STRUCTURED_DEEP,
  "openai/gpt-oss-safeguard-20b",
  ONYX_MODEL_VISION,
] as const;

export function supportsGroqStructuredOutput(model: string): boolean {
  return (ONYX_GROQ_STRUCTURED_OUTPUT_MODELS as readonly string[]).includes(
    model
  );
}

/** Groq üretim modelleri — env override için izin verilenler */
export const ONYX_ALLOWED_GROQ_MODELS = [
  ONYX_MODEL_FAST,
  ONYX_MODEL_DEEP,
  ONYX_MODEL_DEEP_ALT,
  ONYX_MODEL_STRUCTURED,
  ONYX_MODEL_VISION,
  "openai/gpt-oss-safeguard-20b",
  "qwen/qwen3-32b",
] as const;

/**
 * Groq'tan kaldırılmış modeller — `.env` override yok sayılır, alias varsa yönlendirilir.
 * Kaynak: https://console.groq.com/docs/deprecations
 */
export const ONYX_DECOMMISSIONED_GROQ_MODELS = [
  // Vision → Scout
  "llama-3.2-90b-vision-preview",
  "llama-3.2-11b-vision-preview",
  "llava-v1.5-7b-4096-preview",
  // Llama 4 Maverick (metin; vision değil)
  "meta-llama/llama-4-maverick-17b-128e-instruct",
  // Eski Llama 3.x
  "llama3-70b-8192",
  "llama3-8b-8192",
  "llama-3.1-70b-versatile",
  "llama-3.1-70b-specdec",
  "llama-3.3-70b-specdec",
  "llama-3.2-1b-preview",
  "llama-3.2-3b-preview",
  "llama-3.2-11b-text-preview",
  "llama-3.2-90b-text-preview",
  // DeepSeek / Qwen eski
  "deepseek-r1-distill-llama-70b",
  "deepseek-r1-distill-llama-70b-specdec",
  "deepseek-r1-distill-qwen-32b",
  "qwen-qwq-32b",
  "qwen-2.5-32b",
  "qwen-2.5-coder-32b",
  // Diğer
  "gemma2-9b-it",
  "gemma-7b-it",
  "mixtral-8x7b-32768",
  "mistral-saba-24b",
  "moonshotai/kimi-k2-instruct",
  "moonshotai/kimi-k2-instruct-0905",
  "meta-llama/llama-guard-4-12b",
  "llama-guard-3-8b",
  "playai-tts",
  "playai-tts-arabic",
  "distil-whisper-large-v3-en",
  "llama3-groq-8b-8192-tool-use-preview",
  "llama3-groq-70b-8192-tool-use-preview",
] as const;

/** Eski model id → güncel Onyx varsayılanı */
export const ONYX_LEGACY_GROQ_MODEL_ALIASES: Record<string, string> = {
  // Vision
  "llama-3.2-90b-vision-preview": ONYX_MODEL_VISION,
  "llama-3.2-11b-vision-preview": ONYX_MODEL_VISION,
  "llava-v1.5-7b-4096-preview": ONYX_MODEL_VISION,
  "llama-3.2-11b-text-preview": ONYX_MODEL_FAST,
  "meta-llama/llama-4-maverick-17b-128e-instruct": ONYX_MODEL_DEEP_ALT,
  "llama3-8b-8192": ONYX_MODEL_FAST,
  "llama-3.2-1b-preview": ONYX_MODEL_FAST,
  "llama-3.2-3b-preview": ONYX_MODEL_FAST,
  "gemma2-9b-it": ONYX_MODEL_FAST,
  "gemma-7b-it": ONYX_MODEL_FAST,
  // Derin metin
  "llama3-70b-8192": ONYX_MODEL_DEEP,
  "llama-3.1-70b-versatile": ONYX_MODEL_DEEP,
  "llama-3.1-70b-specdec": ONYX_MODEL_DEEP,
  "deepseek-r1-distill-llama-70b": ONYX_MODEL_DEEP,
  "deepseek-r1-distill-llama-70b-specdec": ONYX_MODEL_DEEP,
  "mixtral-8x7b-32768": ONYX_MODEL_DEEP,
  "mistral-saba-24b": ONYX_MODEL_DEEP,
  "moonshotai/kimi-k2-instruct": ONYX_MODEL_DEEP_ALT,
  "moonshotai/kimi-k2-instruct-0905": ONYX_MODEL_DEEP_ALT,
  "qwen-2.5-coder-32b": ONYX_MODEL_DEEP_ALT,
  "llama-3.2-90b-text-preview": ONYX_MODEL_DEEP,
  "llama-3.3-70b-specdec": ONYX_MODEL_DEEP,
  "deepseek-r1-distill-qwen-32b": ONYX_MODEL_DEEP_ALT,
  "qwen-qwq-32b": "qwen/qwen3-32b",
  "qwen-2.5-32b": "qwen/qwen3-32b",
};

export function isDecommissionedGroqModel(model: string): boolean {
  return (ONYX_DECOMMISSIONED_GROQ_MODELS as readonly string[]).includes(model);
}

export function resolveLegacyGroqModel(model: string): string | undefined {
  return ONYX_LEGACY_GROQ_MODEL_ALIASES[model];
}

export function isAllowedGroqModel(model: string): boolean {
  return (ONYX_ALLOWED_GROQ_MODELS as readonly string[]).includes(model);
}
