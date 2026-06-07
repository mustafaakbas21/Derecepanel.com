/**
 * Optik TXT/DAT/PRN — önce windows-1254, geçersiz UTF-8 ise fallback.
 */
export async function decodeOpticalFile(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);

  try {
    const tr = new TextDecoder("windows-1254");
    const text = tr.decode(bytes);
    if (text && !hasReplacementNoise(text)) return text.replace(/\uFFFD/g, "");
  } catch {
    /* fallback */
  }

  const utf8 = new TextDecoder("utf-8", { fatal: false });
  return utf8.decode(bytes).replace(/\uFFFD/g, "");
}

function hasReplacementNoise(text: string): boolean {
  const ratio = (text.match(/\uFFFD/g) || []).length / Math.max(text.length, 1);
  return ratio > 0.02;
}
