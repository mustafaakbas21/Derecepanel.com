import "server-only";

import { YoutubeTranscript } from "youtube-transcript";
import {
  extractYoutubeUrlFromText,
  extractYoutubeVideoId,
  isYoutubeLinkInText,
} from "@/lib/onyx/youtube-link";

/** Groq TPM için transkript üst sınırı (~3k token) */
const YOUTUBE_TRANSCRIPT_MAX_CHARS = 11_000;

/** generateObject user prompt — transcript dahil toplam üst sınır */
export const ONYX_YOUTUBE_PROMPT_MAX_CHARS = 13_500;

/** Çift transcript çekimini önler (route + skill-complete) */
export const YOUTUBE_PROMPT_RAG_MARKER = "ONYX_YOUTUBE_TRANSCRIPT_RAG";

export const YOUTUBE_TRANSCRIPT_UNAVAILABLE_MESSAGE =
  "Üzgünüm, bu videonun altyazıları (CC) kapalı olduğu için içeriğini okuyamıyorum. Başka bir konu anlatım videosu deneyebilir misin?";

export class YoutubeTranscriptUnavailableError extends Error {
  readonly code = "YOUTUBE_TRANSCRIPT_UNAVAILABLE" as const;

  constructor(message = YOUTUBE_TRANSCRIPT_UNAVAILABLE_MESSAGE) {
    super(message);
    this.name = "YoutubeTranscriptUnavailableError";
  }
}

export type YoutubeTranscriptResult = {
  videoUrl: string;
  videoId: string;
  transcript: string;
  source: "transcript";
};

export { extractYoutubeUrlFromText, extractYoutubeVideoId, isYoutubeLinkInText };

function truncateTranscript(text: string): string {
  const t = text.trim();
  if (t.length <= YOUTUBE_TRANSCRIPT_MAX_CHARS) return t;
  return sampleTranscriptForRag(t, YOUTUBE_TRANSCRIPT_MAX_CHARS);
}

/** Uzun videolarda giriş + orta örnekler + son bölüm — sadece baştan kesme yok */
function sampleTranscriptForRag(fullText: string, maxChars: number): string {
  const t = fullText.trim();
  if (t.length <= maxChars) return t;

  const introSize = Math.floor(maxChars * 0.38);
  const outroSize = Math.floor(maxChars * 0.22);
  const markerOverhead = 120;
  const middleBudget = maxChars - introSize - outroSize - markerOverhead;

  const intro = t.slice(0, introSize);
  const outro = t.slice(-outroSize);
  const middleStart = introSize;
  const middleEnd = t.length - outroSize;
  const middleLen = Math.max(0, middleEnd - middleStart);

  if (middleLen <= 0 || middleBudget < 400) {
    return `${intro}\n\n[… transkript kısaltıldı …]\n\n${outro}`;
  }

  if (middleLen <= middleBudget) {
    return `${intro}\n\n[…]\n\n${t.slice(middleStart, middleEnd)}\n\n[…]\n\n${outro}\n\n[Not: Transkript kısaltıldı.]`;
  }

  const chunkSize = Math.floor(middleBudget / 3);
  const chunk1 = t.slice(middleStart, middleStart + chunkSize);
  const mid = middleStart + Math.floor(middleLen / 2);
  const chunk2 = t.slice(
    Math.max(middleStart, mid - Math.floor(chunkSize / 2)),
    Math.min(middleEnd, mid + Math.ceil(chunkSize / 2))
  );
  const chunk3 = t.slice(middleEnd - chunkSize, middleEnd);

  return `${intro}

[… transkript ortasından örnekler …]

${chunk1}

---

${chunk2}

---

${chunk3}

[…]

${outro}

[Not: Video uzun; transkript giriş, orta ve son bölümlerden örneklendi.]`;
}

/** TPM retry — RAG prompt içindeki transkript bloğunu küçültür */
export function shrinkYoutubeAiPrompt(prompt: string, maxChars: number): string {
  const p = String(prompt ?? "").trim();
  if (p.length <= maxChars) return p;
  if (!p.includes(YOUTUBE_PROMPT_RAG_MARKER)) {
    return p.length <= maxChars ? p : `${p.slice(0, maxChars)}…`;
  }

  const open = p.indexOf('"""');
  const close = open >= 0 ? p.indexOf('"""', open + 3) : -1;
  if (open < 0 || close < 0) {
    return p.length <= maxChars ? p : `${p.slice(0, maxChars)}…`;
  }

  const before = p.slice(0, open + 3);
  const transcript = p.slice(open + 3, close);
  const after = p.slice(close);
  const overhead = before.length + after.length + 64;
  const transcriptMax = Math.max(1500, maxChars - overhead);
  const shrunk = sampleTranscriptForRag(transcript, transcriptMax);
  return `${before}${shrunk}${after}`;
}

/**
 * YouTube InnerTube / altyazı API — video ID veya tam URL kabul eder.
 */
export async function fetchYoutubeTranscript(
  videoUrlOrMessage: string
): Promise<YoutubeTranscriptResult> {
  const videoId = extractYoutubeVideoId(videoUrlOrMessage);
  if (!videoId) {
    throw new YoutubeTranscriptUnavailableError(
      "Geçerli bir YouTube linki bulunamadı. Lütfen watch veya youtu.be bağlantısını yapıştırın."
    );
  }

  const videoUrl =
    extractYoutubeUrlFromText(videoUrlOrMessage) ??
    `https://www.youtube.com/watch?v=${videoId}`;

  let transcriptArray: Awaited<ReturnType<typeof YoutubeTranscript.fetchTranscript>>;
  try {
    transcriptArray = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: "tr",
    });
  } catch {
    try {
      transcriptArray = await YoutubeTranscript.fetchTranscript(videoId);
    } catch (err) {
      console.error("[Onyx] YouTube transcript çekilemedi:", err);
      throw new YoutubeTranscriptUnavailableError();
    }
  }

  const fullText = transcriptArray.map((item) => item.text).join(" ").trim();
  if (!fullText) {
    throw new YoutubeTranscriptUnavailableError();
  }

  return {
    videoUrl,
    videoId,
    transcript: truncateTranscript(fullText),
    source: "transcript",
  };
}

/**
 * AI isteğinden hemen önce — transkripti kullanıcı prompt'una enjekte eder (RAG).
 */
export async function prepareYoutubePromptForAi(
  userMessage: string
): Promise<string> {
  const message = String(userMessage ?? "").trim();
  if (!message) {
    throw new YoutubeTranscriptUnavailableError(
      "YouTube linki veya video metni gerekli."
    );
  }
  if (message.includes(YOUTUBE_PROMPT_RAG_MARKER)) {
    return message;
  }

  const { videoUrl, transcript } = await fetchYoutubeTranscript(message);

  return `${YOUTUBE_PROMPT_RAG_MARKER}

Öğrencinin gönderdiği video linki: ${videoUrl}

İşte bu videonun arka planda çekilen tam metin dökümü (Transcript):
"""
${transcript}
"""

Lütfen yalnızca bu transkript metnini analiz et. Videoyu izlemediğini varsayma; metinde geçmeyen formül veya iddia uydurma.
Sistem kurallarındaki JSON formatında (özet, kritikKavramlar, anlamaKontrolu) çıktıyı oluştur.

Öğrencinin orijinal mesajı: ${message}`;
}

export function formatYoutubeTranscriptForPrompt(
  result: YoutubeTranscriptResult
): string {
  return `${YOUTUBE_PROMPT_RAG_MARKER}\n[YOUTUBE TRANSKRİPT — ${result.videoUrl}]\n${result.transcript}`;
}
