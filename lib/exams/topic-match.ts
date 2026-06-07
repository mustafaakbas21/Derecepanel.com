/** Port: deneme-konu-bulk.js — fuzzy konu eşleme (eşik ≥ 70) */

export function normalizeTopicText(text: string | null | undefined): string {
  if (text == null || text === "") return "";
  let s = String(text).trim();
  try {
    s = s.toLocaleLowerCase("tr-TR");
  } catch {
    s = s.toLowerCase();
  }
  return s
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreMatch(pastedNorm: string, optNorm: string): number {
  if (!pastedNorm || !optNorm) return 0;
  if (pastedNorm === optNorm) return 100;
  if (pastedNorm.length >= 2 && optNorm.includes(pastedNorm)) return 85;
  if (optNorm.length >= 4 && pastedNorm.includes(optNorm)) return 75;
  return 0;
}

export function matchTopicLabel(
  lineRaw: string,
  options: { id: string; label: string }[]
): string {
  const pastedNorm = normalizeTopicText(lineRaw);
  if (!pastedNorm) return "";
  let bestVal = "";
  let bestScore = 0;
  let bestLabLen = 0;
  for (const o of options) {
    const lab = normalizeTopicText(o.label);
    if (!lab) continue;
    const sc = scoreMatch(pastedNorm, lab);
    if (sc > bestScore || (sc === bestScore && sc > 0 && lab.length > bestLabLen)) {
      bestScore = sc;
      bestVal = o.id;
      bestLabLen = lab.length;
    }
  }
  return bestScore >= 70 ? bestVal : "";
}

export function parseZorluk(raw: string): string {
  const s = normalizeTopicText(raw);
  if (!s) return "2";
  if (s === "0" || s.includes("kolay")) return "0";
  if (s === "1" || s.includes("orta")) return "1";
  if (s.includes("cok") || s === "3") return "3";
  if (s === "2" || s.includes("zor")) return "2";
  const n = parseInt(String(raw || "").trim(), 10);
  if (!Number.isNaN(n)) {
    if (n <= 0) return "0";
    if (n === 1) return "1";
    if (n === 2) return "2";
    if (n >= 3) return "3";
  }
  return "2";
}
