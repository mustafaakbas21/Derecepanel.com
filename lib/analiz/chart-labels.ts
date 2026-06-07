/** Grafik eksenleri için uzun ders/konu adlarını kısaltır (tam metin title/tooltip’te kalır). */

function shortenSectionPrefix(head: string): string {
  let h = String(head ?? "")
    .replace(/^AYT\s+/i, "AYT ")
    .replace(/^TYT\s+/i, "TYT ")
    .replace(/Türk Dili ve Edebiyatı/gi, "Edeb.")
    .replace(/Sosyal Bilimler-1/gi, "SB1")
    .replace(/Sosyal Bilimler-2/gi, "SB2")
    .replace(/Fen Bilimleri/gi, "Fen")
    .replace(/Temel Matematik/gi, "T.Mat")
    .replace(/\s+—\s+/g, " ")
    .trim();
  if (h.length > 16) h = `${h.slice(0, 14)}…`;
  return h;
}

export function shortenChartLabel(text: string, maxLen = 34): string {
  const s = String(text ?? "")
    .replace(/\s+/g, " ")
    .trim();
  if (!s || s.length <= maxLen) return s;

  const segments = s
    .split(/\s*[·—–]\s*|\s+-\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const tail = segments[segments.length - 1] ?? s;

  if (tail.length <= maxLen) {
    if (segments.length > 1) {
      const head = shortenSectionPrefix(segments[0] ?? "");
      const combo = head ? `${head} · ${tail}` : tail;
      if (combo.length <= maxLen) return combo;
    }
    return tail;
  }

  return `${tail.slice(0, Math.max(1, maxLen - 1))}…`;
}

export function chartYAxisWidth(labels: string[], maxLen = 34): number {
  const min = 132;
  const max = 252;
  const longest = labels.reduce(
    (m, raw) => Math.max(m, shortenChartLabel(raw, maxLen).length),
    0
  );
  return Math.min(max, Math.max(min, Math.round(longest * 6.5) + 14));
}

export function chartVerticalBarHeight(count: number, labels: string[]): number {
  const long = labels.some((l) => String(l).length > 26);
  const per = long ? 50 : 42;
  return Math.max(240, count * per + 36);
}
