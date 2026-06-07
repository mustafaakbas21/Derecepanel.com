/** Client-safe helpers for YouTube URL detection/parsing (no server-only). */

const YOUTUBE_URL_RE =
  /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{6,})/i;

export function isYoutubeLinkInText(text: string): boolean {
  return /youtube\.com|youtu\.be/i.test(String(text ?? ""));
}

export function extractYoutubeUrlFromText(text: string): string | null {
  const m = String(text ?? "").match(YOUTUBE_URL_RE);
  if (!m) return null;
  return `https://www.youtube.com/watch?v=${m[1]}`;
}

export function extractYoutubeVideoId(text: string): string | null {
  const url = extractYoutubeUrlFromText(text);
  if (url) {
    const id = url.match(/[?&]v=([\w-]+)/)?.[1];
    if (id) return id;
  }
  const bare = String(text ?? "").match(YOUTUBE_URL_RE);
  return bare?.[1] ?? null;
}

