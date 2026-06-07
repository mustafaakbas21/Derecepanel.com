import type { FasciclePayload, TaramaRecord } from "@/lib/taramalar/types";

/** ESKİ tarama-deposu.js buildFasciclePayloadFromTaramaRecord */
export function buildFasciclePayloadFromTarama(rec: TaramaRecord): FasciclePayload {
  const questions = rec.questions ?? [];
  const keyParts = questions.map((q) => {
    const a = String(q.answer ?? "")
      .trim()
      .toUpperCase();
    const m = a.match(/[A-E]/);
    return m ? m[0] : " ";
  });
  const title =
    (rec.coverTitle && String(rec.coverTitle).trim()) ||
    (rec.name && String(rec.name).trim()) ||
    "Tarama";
  return {
    id: rec.id,
    title,
    questionCount: questions.length,
    answerKey: keyParts.join(""),
    template: (rec.layout && rec.layout.sablon) || "",
    source: "tarama_deposu_send",
    depoId: rec.id,
    metaName: rec.name || "",
    pdf_file_id: rec.pdf_file_id,
  };
}

export function validateFascicleAnswerKey(answerKey: string): boolean {
  const trimmed = answerKey.trim();
  if (!trimmed) return false;
  return !/\s{2,}/.test(trimmed) && trimmed.length > 0;
}
