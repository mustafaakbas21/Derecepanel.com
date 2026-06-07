import { normalizeTopicText } from "@/lib/exams/topic-match";

const ANSWER_LETTERS = "ABCDE";

function parseLetter(raw: string): string {
  const m = String(raw || "")
    .trim()
    .toUpperCase()
    .match(/[ABCDE]/);
  return m ? m[0] : "";
}

/** Cevap anahtarı bölgesinin başlangıç indeksini bulur (son eşleşme). */
export function findAnswerKeyStartIndex(fullText: string): number {
  const norm = normalizeTopicText(fullText);
  const markers = [
    "cevap anahtari",
    "cevap anahtar",
    "dogru cevaplar",
    "dogru cevap",
    "soru anahtari",
    "anahtar tablosu",
    "yanit anahtari",
    "yant anahtari",
  ];
  let best = -1;
  for (const m of markers) {
    const idx = norm.lastIndexOf(m);
    if (idx > best) best = idx;
  }
  if (best >= 0) return best;
  const rawMarkers = [/CEVAP\s*ANAHTAR[Iİ]/gi, /DOĞRU\s*CEVAPLAR?/gi, /DOGRU\s*CEVAPLAR?/gi];
  for (const re of rawMarkers) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(fullText)) !== null) {
      if (m.index > best) best = m.index;
    }
  }
  return best;
}

export function extractAnswerKeyRegion(fullText: string): string {
  const start = findAnswerKeyStartIndex(fullText);
  if (start >= 0) return fullText.slice(start);
  return fullText.slice(Math.floor(fullText.length * 0.82));
}

type ParseCandidate = { answers: Map<number, string>; score: number; method: string };

function scoreCandidate(map: Map<number, string>, questionCount: number): number {
  if (!map.size) return 0;
  let inRange = 0;
  for (const [q] of map) {
    if (q >= 1 && q <= questionCount) inRange++;
  }
  const coverage = inRange / questionCount;
  const density = Math.min(1, inRange / Math.max(1, questionCount * 0.5));
  return inRange * 2 + coverage * 40 + density * 20;
}

/** 1.A  2)B  3-B  4: C  5 A */
function parseNumberedPairs(text: string, questionCount: number): Map<number, string> {
  const answers = new Map<number, string>();
  const upper = text.toUpperCase();

  const patterns = [
    /(?:^|[\s,;|])(\d{1,3})\s*[\.\)\:\-–]\s*([A-E])\b/gi,
    /(?:^|[\s,;|])(\d{1,3})\s+([A-E])(?=[\s,;|.\d]|$)/gi,
    /\bS\s*(\d{1,3})\s*[\.\:\-]?\s*([A-E])\b/gi,
  ];

  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(upper)) !== null) {
      const q = parseInt(m[1]!, 10);
      const letter = parseLetter(m[2]);
      if (q > 0 && q <= questionCount && letter) answers.set(q, letter);
    }
  }
  return answers;
}

/** Satırda ardışık harf dizisi: ABCDEABCDE veya A B C D E */
function parseLetterRuns(text: string, questionCount: number, startQ = 1): Map<number, string> {
  const answers = new Map<number, string>();
  const lines = text.split(/\n+/);

  for (const line of lines) {
    const compact = line.replace(/[^A-Ea-e]/gi, "").toUpperCase();
    if (compact.length < 8) continue;
    const ratio = compact.length / Math.max(1, line.replace(/\s/g, "").length);
    if (ratio < 0.55) continue;

    let q = startQ;
    for (let i = 0; i < compact.length && q <= questionCount; i++) {
      const ch = compact.charAt(i);
      if (ANSWER_LETTERS.includes(ch)) {
        if (!answers.has(q)) answers.set(q, ch);
        q++;
      }
    }
    if (answers.size >= 10) break;
  }
  return answers;
}

/** Izgara: üstte numaralar altta harfler veya 5'li sütunlar */
function parseGridColumns(text: string, questionCount: number): Map<number, string> {
  const answers = new Map<number, string>();
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);

  for (let i = 0; i < lines.length - 1; i++) {
    const numLine = lines[i]!;
    const nums = [...numLine.matchAll(/\b(\d{1,3})\b/g)].map((m) => parseInt(m[1]!, 10));
    if (nums.length < 4) continue;

    const letterLine = lines[i + 1]!;
    const letters = [...letterLine.matchAll(/\b([A-E])\b/gi)].map((m) => parseLetter(m[1]));
    if (letters.length < 4) continue;

    const n = Math.min(nums.length, letters.length);
    for (let j = 0; j < n; j++) {
      const q = nums[j]!;
      const letter = letters[j]!;
      if (q > 0 && q <= questionCount && letter) answers.set(q, letter);
    }
    if (answers.size >= 8) break;
  }
  return answers;
}

/** 1-20 satırı + sonraki harf satırı */
function parseRangeRows(text: string, questionCount: number): Map<number, string> {
  const answers = new Map<number, string>();
  const blockRe = /(\d{1,3})\s*[-–]\s*(\d{1,3})\s+([A-E]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = blockRe.exec(text)) !== null) {
    const from = parseInt(m[1]!, 10);
    const letters = m[3]!.toUpperCase();
    for (let i = 0; i < letters.length; i++) {
      const q = from + i;
      const letter = parseLetter(letters.charAt(i));
      if (q > 0 && q <= questionCount && letter) answers.set(q, letter);
    }
  }
  return answers;
}

function mergeMaps(...maps: Map<number, string>[]): Map<number, string> {
  const out = new Map<number, string>();
  for (const m of maps) {
    for (const [k, v] of m) {
      if (!out.has(k)) out.set(k, v);
    }
  }
  return out;
}

export function parseAnswerKeyFromText(
  text: string,
  questionCount: number
): Map<number, string> {
  const candidates: ParseCandidate[] = [];
  const sources = [
    text,
    text.replace(/\s+/g, " "),
    text.replace(/[^0-9A-Ea-e\s.\n\-–:;,]/g, " "),
  ];

  for (const src of sources) {
    const numbered = parseNumberedPairs(src, questionCount);
    candidates.push({
      answers: numbered,
      score: scoreCandidate(numbered, questionCount),
      method: "numbered",
    });

    const runs = parseLetterRuns(src, questionCount);
    candidates.push({
      answers: runs,
      score: scoreCandidate(runs, questionCount),
      method: "runs",
    });

    const grid = parseGridColumns(src, questionCount);
    candidates.push({
      answers: grid,
      score: scoreCandidate(grid, questionCount),
      method: "grid",
    });

    const ranges = parseRangeRows(src, questionCount);
    candidates.push({
      answers: ranges,
      score: scoreCandidate(ranges, questionCount),
      method: "ranges",
    });
  }

  candidates.sort((a, b) => b.score - a.score);
  let best = candidates[0]?.answers ?? new Map<number, string>();

  if (best.size < questionCount * 0.12) {
    const merged = mergeMaps(
      ...candidates.slice(0, 6).map((c) => c.answers)
    );
    if (scoreCandidate(merged, questionCount) > scoreCandidate(best, questionCount)) {
      best = merged;
    }
  }

  if (best.size < questionCount * 0.1) {
    const letters = text.replace(/[^A-E]/gi, "").toUpperCase();
    if (letters.length >= questionCount * 0.25) {
      const seq = new Map<number, string>();
      let q = 1;
      for (let i = 0; i < letters.length && q <= questionCount; i++) {
        const ch = letters.charAt(i);
        if (ANSWER_LETTERS.includes(ch)) {
          seq.set(q, ch);
          q++;
        }
      }
      if (scoreCandidate(seq, questionCount) > scoreCandidate(best, questionCount)) {
        best = seq;
      }
    }
  }

  return best;
}

/** Birden fazla kaynaktan en iyi cevap anahtarını seçer. */
export function resolveAnswerKey(
  pages: { text: string }[],
  fullText: string,
  questionCount: number
): { answers: Map<number, string>; method: string } {
  const keyRegion = extractAnswerKeyRegion(fullText);
  const tail = pages.slice(-8).map((p) => p.text).join("\n");
  const lastPages = pages.slice(-3).map((p) => p.text).join("\n");

  const pools: { text: string; label: string }[] = [
    { text: tail, label: "tail8" },
    { text: lastPages, label: "tail3" },
    { text: keyRegion, label: "keyRegion" },
    { text: fullText.slice(-16000), label: "end16k" },
    { text: fullText, label: "full" },
  ];

  let bestMap = new Map<number, string>();
  let bestScore = 0;
  let bestMethod = "none";

  for (const pool of pools) {
    const map = parseAnswerKeyFromText(pool.text, questionCount);
    const sc = scoreCandidate(map, questionCount);
    if (sc > bestScore) {
      bestScore = sc;
      bestMap = map;
      bestMethod = pool.label;
    }
  }

  return { answers: bestMap, method: bestMethod };
}

export function detectBookletType(fullText: string): "A" | "B" | null {
  const t = normalizeTopicText(fullText.slice(0, 6000) + fullText.slice(-4000));
  if (/\b(b|beta)\s*kitapcik\b/.test(t) || /\bkitapcik\s*b\b/.test(t)) return "B";
  if (/\b(a|alfa)\s*kitapcik\b/.test(t) || /\bkitapcik\s*a\b/.test(t)) return "A";
  return null;
}

export function parseBookletRemap(
  tailText: string,
  questionCount: number
): Map<number, number> | null {
  const remap = new Map<number, number>();
  for (const line of tailText.split(/\n+/)) {
    const m = line.match(/(\d{1,3})\s*[-–→]\s*(\d{1,3})/);
    if (!m) continue;
    const from = parseInt(m[1]!, 10);
    const to = parseInt(m[2]!, 10);
    if (from > 0 && from <= questionCount && to > 0 && to <= questionCount) {
      remap.set(from, to);
    }
  }
  return remap.size >= 3 ? remap : null;
}
