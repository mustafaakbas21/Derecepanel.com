/** PDF → sayfa metinleri (sunucu). Önce pdfjs, yedek pdf-parse. */

export type PageText = { pageIndex: number; text: string };

export async function extractPdfPages(buffer: Buffer): Promise<PageText[]> {
  try {
    const pages = await extractWithPdfJs(new Uint8Array(buffer));
    if (pages.some((p) => p.text.length > 30)) return pages;
  } catch {
    /* fallback */
  }

  try {
    const text = await extractFullTextPdfParse(buffer);
    if (!text.trim()) return [{ pageIndex: 0, text: "" }];
    const byFeed = text.split(/\f+/).map((p, i) => ({ pageIndex: i, text: p.trim() }));
    if (byFeed.length > 1 && byFeed.some((p) => p.text.length > 20)) return byFeed;
    const n = estimatePageCount(buffer, text);
    return splitProportionalPages(text, n);
  } catch {
    return [{ pageIndex: 0, text: "" }];
  }
}

async function extractFullTextPdfParse(buffer: Buffer): Promise<string> {
  const mod = await import("pdf-parse");
  const pdfParse = mod.default ?? mod;
  const data = await pdfParse(buffer);
  return String(data?.text || "");
}

function estimatePageCount(buffer: Buffer, text: string): number {
  const pageMarkers = text.match(/(?:^|\n)\s*(?:sayfa|page)\s*\d+/gi);
  if (pageMarkers?.length) return pageMarkers.length;
  return Math.max(1, Math.min(80, Math.ceil(text.length / 2800)));
}

function splitProportionalPages(text: string, pageCount: number): PageText[] {
  const clean = text.replace(/\r/g, "\n");
  const size = Math.ceil(clean.length / pageCount);
  const out: PageText[] = [];
  for (let i = 0; i < pageCount; i++) {
    const slice = clean.slice(i * size, (i + 1) * size).trim();
    if (slice) out.push({ pageIndex: i, text: slice });
  }
  return out.length ? out : [{ pageIndex: 0, text: clean }];
}

async function extractWithPdfJs(data: Uint8Array): Promise<PageText[]> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({
    data,
    useSystemFonts: true,
    disableFontFace: true,
    verbosity: 0,
  }).promise;

  const pages: PageText[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const parts: string[] = [];
    let lastY: number | null = null;
    let line = "";

    for (const item of content.items) {
      if (!("str" in item) || typeof item.str !== "string") continue;
      const str = item.str;
      const tr = "transform" in item && Array.isArray(item.transform) ? item.transform[5] : null;
      if (tr != null && lastY != null && Math.abs(tr - lastY) > 4) {
        if (line.trim()) parts.push(line.trim());
        line = str;
      } else {
        line += (line && !line.endsWith(" ") && !str.startsWith(" ") ? " " : "") + str;
      }
      if (tr != null) lastY = tr;
    }
    if (line.trim()) parts.push(line.trim());

    const text = parts.join("\n").replace(/[ \t]+/g, " ").trim();
    pages.push({ pageIndex: i - 1, text });
    page.cleanup();
  }
  await doc.destroy();
  return pages;
}

export function joinPages(pages: PageText[]): string {
  return pages.map((p) => p.text).join("\n\n---PAGE---\n\n");
}

export function tailText(pages: PageText[], tailCount = 6): string {
  return pages.slice(-tailCount).map((p) => p.text).join("\n");
}
