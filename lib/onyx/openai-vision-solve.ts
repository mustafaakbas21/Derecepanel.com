import { ONYX_COMPLETION_TEMPERATURE } from "@/lib/onyx/constants";
import { ONYX_SOLVE_MAX_TOKENS } from "@/lib/onyx/solve-accuracy-protocol";
import { buildOnyxSolveJsonSystemPrompt } from "@/lib/onyx/solve-json-prompt";
import { buildOnyxSolveUserPrompt } from "@/lib/onyx/solve-teacher-protocol";
import type { OnyxRole } from "@/lib/onyx/role-quick-prompts";
import type { OnyxVisionInput } from "@/lib/onyx/groq-server";

const OPENAI_VISION_MODEL =
  process.env.OPENAI_VISION_MODEL?.trim() || "gpt-4o";

export async function completeSolveWithOpenAI(
  prompt: string,
  vision?: OnyxVisionInput,
  role?: OnyxRole,
  curriculumList?: string
): Promise<{ raw: string; model: string }> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY yapılandırılmadı.");
  }

  const userText = buildOnyxSolveUserPrompt({
    prompt,
    hasVision: Boolean(vision?.base64?.trim()),
  });

  const userContent: Array<Record<string, unknown>> = [
    { type: "text", text: userText },
  ];

  if (vision?.base64?.trim()) {
    userContent.push({
      type: "image_url",
      image_url: {
        url: `data:${vision.mimeType || "image/jpeg"};base64,${vision.base64}`,
      },
    });
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_VISION_MODEL,
      temperature: ONYX_COMPLETION_TEMPERATURE,
      max_tokens: ONYX_SOLVE_MAX_TOKENS,
      messages: [
        {
          role: "system",
          content: buildOnyxSolveJsonSystemPrompt(role, curriculumList),
        },
        { role: "user", content: userContent },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `OpenAI vision hatası (${res.status}): ${errText.slice(0, 200)}`
    );
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    model?: string;
  };

  const raw =
    data.choices?.[0]?.message?.content?.trim() ||
    "Yanıt oluşturulamadı.";

  return { raw, model: data.model || OPENAI_VISION_MODEL };
}
