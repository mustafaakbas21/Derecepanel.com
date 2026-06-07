/** Onyx Continuity Engine — mesaj bitiş protokolü ve kesinti algılama */

export const ONYX_ANALYSIS_COMPLETE_MARKER = "Analiz başarıyla tamamlandı ✅";

export const ONYX_RESUME_PREFIX = "Analize buradan devam ediyorum:";

export const ONYX_CONTINUITY_PROTOCOL = `[CONTINUITY ENGINE — Mesaj Bitiş Protokolü]
- Mesajının sonunda analiz gerçekten tamamlandıysa, en sonda ayrı bir satır olarak şu ifadeyi kullan: "${ONYX_ANALYSIS_COMPLETE_MARKER}"
- Cevabın uzunsa ve token limitine yaklaşırsan cümleyi yarım bırakma. Konuyu toparlayıp şu cümleyle mesajı sonlandır: "...detayları aşağıda açıklamaya devam ediyorum."
- Yanıtın uzunluk/token sınırı nedeniyle kesilecekse "${ONYX_ANALYSIS_COMPLETE_MARKER}" ifadesini KESİNLİKLE kullanma.
- Bir sonraki turda (devam mesajında) ilk cümlen mutlaka şu ifadeyle başlasın: "${ONYX_RESUME_PREFIX}" — ardından önceki cümleyi tekrarlamadan kaldığın yerden yaz.`;

/** Kullanıcı "devam" butonu metni */
export const ONYX_CONTINUE_USER_PROMPT =
  "Cevabına kaldığın yerden devam et";

/** Groq çok turlu tamamlama — modele giden talimat */
export const ONYX_CONTINUE_SYSTEM_TURN = `${ONYX_CONTINUE_USER_PROMPT}. İlk cümlen "${ONYX_RESUME_PREFIX}" ile başlasın; önceki paragrafı tekrarlama.`;

const MARKER_REGEX = new RegExp(
  `\\s*${ONYX_ANALYSIS_COMPLETE_MARKER.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`,
  "u"
);

export function hasAnalysisCompleteMarker(content: string): boolean {
  return content.includes(ONYX_ANALYSIS_COMPLETE_MARKER);
}

export function stripAnalysisCompleteMarker(content: string): string {
  return content.replace(MARKER_REGEX, "").trimEnd();
}

export function displayOnyxReplyContent(content: string): string {
  return stripAnalysisCompleteMarker(content);
}

export type OnyxFinishReason = "stop" | "length" | string | null | undefined;

export type OnyxReplyContinuityStatus = {
  finishReason: OnyxFinishReason;
  /** Groq choices[0].finish_reason === "stop" */
  finished: boolean;
  /** Model daha yazacakken durdu — devam gerekli */
  incomplete: boolean;
  /** API uyumluluğu */
  truncated: boolean;
};

/** Incomplete Response Detector — stop dışı her durum yarım yanıt */
export function detectOnyxReplyContinuity(
  finishReason: OnyxFinishReason
): OnyxReplyContinuityStatus {
  const finished = finishReason === "stop";
  const incomplete = !finished;
  return {
    finishReason,
    finished,
    incomplete,
    truncated: incomplete,
  };
}

/** @deprecated `detectOnyxReplyContinuity` kullanın */
export function isOnyxReplyTruncated(finishReason: OnyxFinishReason): boolean {
  return detectOnyxReplyContinuity(finishReason).incomplete;
}

export type OnyxContinuationContext = {
  originalUserPrompt: string;
  partialReply: string;
};
