import {
  applyOnyxModelEnvOverride,
  ONYX_MODEL_DEEP,
  ONYX_MODEL_FAST,
  ONYX_MODEL_VISION,
} from "@/lib/onyx/ai-mode";
import {
  isAllowedGroqModel,
  isDecommissionedGroqModel,
  ONYX_LEGACY_GROQ_MODEL_ALIASES,
  ONYX_MODEL_STRUCTURED,
  ONYX_MODEL_STRUCTURED_DEEP,
  ONYX_MODEL_VISION as VISION_MODEL,
  supportsGroqStructuredOutput,
} from "@/lib/onyx/groq-models";

/** Geçersiz / eski model adlarını güncel Onyx varsayılanına çevir */
export function sanitizeGroqModelName(model: string | undefined): string {
  const trimmed = model?.trim();
  if (!trimmed) return ONYX_MODEL_FAST;

  const legacy = ONYX_LEGACY_GROQ_MODEL_ALIASES[trimmed];
  if (legacy) return legacy;

  const envSafe = applyOnyxModelEnvOverride(trimmed);
  if (envSafe && isAllowedGroqModel(envSafe)) return envSafe;
  if (isAllowedGroqModel(trimmed)) return trimmed;

  if (isDecommissionedGroqModel(trimmed)) {
    if (trimmed.includes("vision") || trimmed.includes("llava")) {
      return VISION_MODEL;
    }
    if (trimmed.includes("maverick") || trimmed.includes("kimi") || trimmed.includes("gpt-oss")) {
      return ONYX_MODEL_DEEP;
    }
    if (trimmed.includes("70b") || trimmed.includes("deepseek")) {
      return ONYX_MODEL_DEEP;
    }
    return ONYX_MODEL_FAST;
  }

  const lower = trimmed.toLowerCase();
  if (lower.includes("scout") || lower.includes("vision") || lower.includes("llava")) {
    return ONYX_MODEL_VISION;
  }
  if (lower.includes("70b") || lower.includes("120b") || lower.includes("oss")) {
    return ONYX_MODEL_DEEP;
  }

  return ONYX_MODEL_FAST;
}

export function resolveOnyxGroqModelSafe(options: {
  hasImage: boolean;
  isDeepMode: boolean;
  override?: string;
}): string {
  if (options.override?.trim()) {
    return sanitizeGroqModelName(options.override);
  }
  if (options.hasImage) {
    return sanitizeGroqModelName(
      applyOnyxModelEnvOverride(process.env.GROQ_MODEL_VISION) ??
        ONYX_MODEL_VISION
    );
  }
  if (options.isDeepMode) {
    return sanitizeGroqModelName(
      applyOnyxModelEnvOverride(process.env.GROQ_MODEL_DEEP) ?? ONYX_MODEL_DEEP
    );
  }
  return sanitizeGroqModelName(
    applyOnyxModelEnvOverride(process.env.GROQ_MODEL) ?? ONYX_MODEL_FAST
  );
}

/** generateObject / json_schema — yalnızca Groq Structured Outputs destekleyen modeller */
export function resolveOnyxStructuredGroqModel(options: {
  isDeepMode?: boolean;
  hasImage?: boolean;
  override?: string;
}): string {
  const override = options.override?.trim();
  if (override) {
    const sanitized = sanitizeGroqModelName(override);
    if (supportsGroqStructuredOutput(sanitized)) return sanitized;
  }

  if (options.hasImage) {
    return sanitizeGroqModelName(
      applyOnyxModelEnvOverride(process.env.GROQ_MODEL_VISION) ??
        ONYX_MODEL_VISION
    );
  }

  const envStructured = applyOnyxModelEnvOverride(
    process.env.GROQ_MODEL_STRUCTURED
  );
  if (envStructured && supportsGroqStructuredOutput(envStructured)) {
    return sanitizeGroqModelName(envStructured);
  }

  // Varsayılan: gpt-oss-20b (TPM dostu). 120B alternatif generate-onyx-object içinde denenir.
  return ONYX_MODEL_STRUCTURED;
}
