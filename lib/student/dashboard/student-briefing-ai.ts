import "server-only";

import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";

import type { StudentExamSnapshot } from "@/lib/student/dashboard/types";
import { ONYX_STRUCTURED_MAX_TEMPERATURE } from "@/lib/onyx/constants";
import { ONYX_MODEL_FAST } from "@/lib/onyx/groq-models";
import { finalizeOnyxSystemPrompt } from "@/lib/onyx/language-rule";

function getGroq() {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) return null;
  return createGroq({ apiKey });
}

export function fallbackStudentBriefing(
  taskCount: number,
  weakTopic: string | null
): string {
  const parts: string[] = [];
  if (taskCount > 0) {
    parts.push(
      `Bugün ${taskCount} görevin var — önce en kısa olanı bitir, momentumu kaçırma.`
    );
  } else {
    parts.push(
      "Bugün henüz atanmış görev yok; koçundan program isteyebilir veya zayıf konuna odaklanabilirsin."
    );
  }

  if (weakTopic) {
    parts.push(
      `Son denemende ${weakTopic} zayıf kaldı; günün ana hedefi bu konuda en az 30 dakika net çalışmak olsun.`
    );
  } else {
    parts.push(
      "Yeni deneme sonucu girersen Onyx radarın daha keskin uyarılar verecek."
    );
  }

  parts.push("YKS maratonu uzun — bugünkü küçük adım, hedefe giden en gerçek yatırım.");
  return parts.slice(0, 3).join(" ");
}

export async function generateStudentBriefingText(input: {
  taskCount: number;
  weakTopic: string | null;
  exam: StudentExamSnapshot | null;
}): Promise<string> {
  const weak =
    input.weakTopic?.trim() ||
    "henüz belirlenmedi (deneme verisi yok)";

  const groq = getGroq();
  if (!groq) {
    return fallbackStudentBriefing(input.taskCount, input.weakTopic);
  }

  const system = finalizeOnyxSystemPrompt(
    `Sen Derecepanel'in asistanı Onyx'sin. Öğrenci paneli sabah brifingi yazıyorsun.
KESİN: Maksimum 3 cümle, Türkçe, enerjik ama abartısız YKS motivasyonu.
Uydurma veri ekleme; yalnızca verilen sayıları kullan.
Öğrenciye "sen" diye hitap et.`
  );

  const prompt = `Sen Derecepanel'in asistanı Onyx'sin. Öğrencinin bugünkü görev sayısı: ${input.taskCount}. Son denemesindeki zayıf konusu: ${weak}.
${input.exam?.tytNet != null ? `Son TYT net: ${input.exam.tytNet.toFixed(1)}.` : ""}
${input.exam?.aytNet != null ? `Son AYT net: ${input.exam.aytNet.toFixed(1)}.` : ""}

Öğrenciye hitap eden, YKS motivasyonu veren ve günün odak noktasını belirten maksimum 3 cümlelik enerjik bir sabah brifingi yaz. Sadece metin döndür.`;

  try {
    const { text } = await generateText({
      model: groq(ONYX_MODEL_FAST),
      system,
      prompt,
      temperature: ONYX_STRUCTURED_MAX_TEMPERATURE,
      maxOutputTokens: 280,
    });
    const trimmed = text.trim();
    if (trimmed.length > 20) return trimmed;
  } catch (err) {
    console.error("[StudentDashboard] AI brifing hatası:", err);
  }

  return fallbackStudentBriefing(input.taskCount, input.weakTopic);
}
