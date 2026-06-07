import "server-only";

import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";

import type { CoachBriefingFacts } from "@/lib/coach/coach-briefing-engine";
import { fallbackBriefingText } from "@/lib/coach/coach-briefing-engine";
import { ONYX_COMPLETION_TEMPERATURE } from "@/lib/onyx/constants";
import { ONYX_MODEL_FAST } from "@/lib/onyx/groq-models";
import { finalizeOnyxSystemPrompt } from "@/lib/onyx/language-rule";

function getGroq() {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) return null;
  return createGroq({ apiKey });
}

/** Onyx — 3 cümlelik proaktif sabah brifingi (Groq) */
export async function generateCoachBriefingText(
  facts: CoachBriefingFacts
): Promise<string> {
  const groq = getGroq();
  if (!groq) {
    return fallbackBriefingText(facts);
  }

  const system = finalizeOnyxSystemPrompt(
    `Sen Onyx'sin. Koç paneli sabah brifingi yazıyorsun.
KESİN: Tam 3 cümle, Türkçe, veriye dayalı, tokat gibi gerçekçi ama koçu harekete geçiren ton.
Uydurma isim veya sayı ekleme — yalnızca verilen özet rakamlarını kullan.
Motivasyon cümlesi değil; operasyonel brifing.`
  );

  const userPrompt = `Sen Onyx'sin. Koçun bugün ${facts.appointmentCount} randevusu var. Radardaki riskli öğrenci sayısı ${facts.radarCount}. Analiz bekleyen (son 7 gün yeni sonuç) öğrenci sayısı: ${facts.pendingAnalysisCount}.
${facts.firstAppointment ? `İlk randevu: ${facts.firstAppointment.time} — ${facts.firstAppointment.studentName}.` : ""}
${facts.upcomingExamName ? `Yaklaşan deneme: ${facts.upcomingExamName} (${facts.upcomingExamDays} gün).` : ""}
${facts.radarHighlights.length ? `Radar özeti: ${facts.radarHighlights.join(" | ")}` : ""}

Koça sabah motivasyonu veren değil, iş odaklı 3 cümlelik proaktif brifing metni yaz. Sadece metin döndür (JSON yok).`;

  try {
    const { text } = await generateText({
      model: groq(ONYX_MODEL_FAST),
      system,
      prompt: userPrompt,
      temperature: ONYX_COMPLETION_TEMPERATURE,
      maxOutputTokens: 320,
    });
    const trimmed = text.trim();
    if (trimmed.length > 20) return trimmed;
  } catch (err) {
    console.error("[CoachBriefing] AI brifing hatası:", err);
  }

  return fallbackBriefingText(facts);
}
