import Groq from "groq-sdk";

import { ONYX_COMPLETION_TEMPERATURE } from "@/lib/onyx/constants";
import {
  ONYX_SOLVE_MAX_TOKENS,
} from "@/lib/onyx/solve-accuracy-protocol";
import { buildOnyxSolveUserPrompt } from "@/lib/onyx/solve-teacher-protocol";
import { resolveOnyxVisionModel } from "@/lib/onyx/ai-mode";
import type { OnyxVisionInput } from "@/lib/onyx/groq-server";
import { completeSolveWithOpenAI } from "@/lib/onyx/openai-vision-solve";
import { parseSolveJsonFromText } from "@/lib/onyx/parse-solve-response";
import {
  enforceCurriculumOnSolveStructured,
  type CurriculumRagContext,
} from "@/lib/onyx/curriculum-rag";
import { formatSolveAsMarkdown } from "@/lib/onyx/solve-format";
import { buildOnyxSolveJsonSystemPrompt } from "@/lib/onyx/solve-json-prompt";
import type { OnyxSolveStructured } from "@/lib/onyx/solve-types";
import type { OnyxRole } from "@/lib/onyx/role-quick-prompts";
import { OnyxGroqError } from "@/lib/onyx/groq-server";

export type CompleteSolveVisionInput = {
  prompt: string;
  vision?: OnyxVisionInput;
  role?: OnyxRole;
  /** Resmi müfredat listesi — sistem prompt enjeksiyonu */
  curriculumRag?: Pick<CurriculumRagContext, "listText" | "subjectIds">;
};

export type CompleteSolveVisionResult = {
  reply: string;
  model: string;
  structured: OnyxSolveStructured;
  rawModelOutput: string;
};

function resolveVisionProvider(): "openai" | "groq" {
  const env = process.env.ONYX_VISION_PROVIDER?.trim().toLowerCase();
  if (env === "openai" && process.env.OPENAI_API_KEY?.trim()) {
    return "openai";
  }
  if (env === "groq") return "groq";
  if (process.env.OPENAI_API_KEY?.trim() && env !== "groq") {
    return "openai";
  }
  return "groq";
}

async function completeSolveWithGroq(
  prompt: string,
  vision?: OnyxVisionInput,
  role?: OnyxRole,
  curriculumList?: string
): Promise<{ raw: string; model: string }> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new OnyxGroqError(
      "Groq API anahtarı yapılandırılmadı.",
      "MISSING_API_KEY"
    );
  }

  const model = resolveOnyxVisionModel();
  const groq = new Groq({ apiKey });
  const userText = buildOnyxSolveUserPrompt({
    prompt,
    hasVision: Boolean(vision?.base64?.trim()),
  });

  const userMessage = vision?.base64?.trim()
    ? {
        role: "user" as const,
        content: [
          { type: "text" as const, text: userText },
          {
            type: "image_url" as const,
            image_url: {
              url: `data:${vision.mimeType};base64,${vision.base64}`,
            },
          },
        ],
      }
    : { role: "user" as const, content: userText };

  const completion = await groq.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: buildOnyxSolveJsonSystemPrompt(role, curriculumList),
      },
      userMessage,
    ],
    temperature: ONYX_COMPLETION_TEMPERATURE,
    max_tokens: ONYX_SOLVE_MAX_TOKENS,
  });

  const raw =
    completion.choices[0]?.message?.content?.trim() ||
    "Yanıt oluşturulamadı.";

  return { raw, model: completion.model || model };
}

/** Vision / metin soru — yapılandırılmış JSON protokolü */
export async function completeSolveVision(
  input: CompleteSolveVisionInput
): Promise<CompleteSolveVisionResult> {
  const hasVision = Boolean(input.vision?.base64?.trim());
  const prompt = String(input.prompt || "").trim();
  if (!prompt && !hasVision) {
    throw new OnyxGroqError("prompt veya görsel gerekli.", "BAD_REQUEST");
  }

  const provider = resolveVisionProvider();
  const role = input.role;

  const curriculumList = input.curriculumRag?.listText;

  async function runProvider(which: "openai" | "groq") {
    if (which === "openai") {
      return completeSolveWithOpenAI(prompt, input.vision, role, curriculumList);
    }
    return completeSolveWithGroq(prompt, input.vision, role, curriculumList);
  }

  let raw: string;
  let model: string;

  try {
    const out = await runProvider(provider);
    raw = out.raw;
    model = out.model;
  } catch (firstErr) {
    const fallback = provider === "openai" ? "groq" : "openai";
    const canFallback =
      fallback === "groq"
        ? Boolean(process.env.GROQ_API_KEY?.trim())
        : Boolean(process.env.OPENAI_API_KEY?.trim());
    if (!canFallback) {
      if (firstErr instanceof OnyxGroqError) throw firstErr;
      throw new OnyxGroqError(
        firstErr instanceof Error ? firstErr.message : "Vision çözüm hatası",
        "SERVER_ERROR"
      );
    }
    const out = await runProvider(fallback);
    raw = out.raw;
    model = out.model;
  }

  const parsed = parseSolveJsonFromText(raw, role);
  if (!parsed) {
    throw new OnyxGroqError(
      "Model geçerli JSON döndürmedi. Lütfen fotoğrafı netleştirip tekrar deneyin.",
      "BAD_REQUEST"
    );
  }

  const structured = input.curriculumRag
    ? enforceCurriculumOnSolveStructured(parsed, input.curriculumRag)
    : parsed;

  return {
    reply: formatSolveAsMarkdown(structured, role),
    model,
    structured,
    rawModelOutput: raw,
  };
}
