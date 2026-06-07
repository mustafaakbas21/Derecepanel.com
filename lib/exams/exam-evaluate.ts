import type { KurumDeneme, MergedExam } from "@/lib/exams/types";

export function normalizeKeyString(src: string): string {
  return String(src || "")
    .toUpperCase()
    .replace(/[^A-E]/g, "");
}

export function normalizeLetter(c: string): string {
  const u = String(c || "")
    .toUpperCase()
    .replace(/[^A-E]/g, "");
  return u.charAt(0) || "";
}

export function buildKeyStringFromExam(exam: KurumDeneme | MergedExam | null, n: number): string {
  const arr = exam?.cevaplar ?? [];
  let s = "";
  for (let i = 0; i < n; i++) {
    s += normalizeLetter(arr[i] ?? "") || " ";
  }
  return s.length >= n ? s.slice(0, n) : s.padEnd(n, " ");
}

/** Optik / LS: answers string veya harf dizisi */
export function normalizeStudentAnswers(raw: unknown, n?: number): string {
  if (Array.isArray(raw)) {
    let s = "";
    for (let i = 0; i < (n ?? raw.length); i++) {
      const ch = String(raw[i] ?? "")
        .toUpperCase()
        .replace(/[^A-E]/g, "")
        .charAt(0);
      s += ch || " ";
    }
    return n != null ? s.slice(0, n) : s;
  }
  let s = String(raw ?? "")
    .toUpperCase()
    .replace(/[^A-E]/g, "");
  if (n != null) {
    while (s.length < n) s += " ";
    s = s.slice(0, n);
  }
  return s;
}

export function buildStudentAnswers(rec: { answers?: unknown }, n: number): string {
  return normalizeStudentAnswers(rec?.answers, n);
}

export interface EvaluateResult {
  correct: number;
  wrong: number;
  blank: number;
  net: number | null;
}

export function evaluateRow(
  studentAnswers: string,
  answerKey: string | null
): EvaluateResult {
  const res: EvaluateResult = { correct: 0, wrong: 0, blank: 0, net: null };
  const key = answerKey ? normalizeKeyString(answerKey) : "";
  if (!key) return res;
  const N = key.length;
  const ans = normalizeKeyString(studentAnswers).padEnd(N, " ");
  for (let i = 0; i < N; i++) {
    const a = ans.charAt(i);
    const k = key.charAt(i);
    if (!a || a === " ") res.blank++;
    else if (a === k) res.correct++;
    else res.wrong++;
  }
  res.net = Math.max(0, Math.round((res.correct - res.wrong / 4) * 100) / 100);
  return res;
}

export function getAnswerKeyFromExam(exam: KurumDeneme | MergedExam | null): {
  key: string;
  count: number;
} | null {
  if (!exam) return null;
  const raw = exam.cevaplar;
  const str = Array.isArray(raw) ? raw.join("") : typeof raw === "string" ? raw : "";
  const key = normalizeKeyString(str);
  if (!key) return null;
  return { key, count: key.length };
}

export function computeMatrixPct(cevaplar: string[], n: number): number {
  if (!n) return 0;
  let filled = 0;
  for (let i = 0; i < n; i++) {
    if (cevaplar[i] && String(cevaplar[i]).length) filled++;
  }
  return Math.round((filled / n) * 100);
}

export function deriveDurum(matrixPct: number, pdfYuklu: boolean): "taslak" | "aktif" {
  if (matrixPct >= 100 && pdfYuklu) return "aktif";
  return "taslak";
}

export function countDyn(
  ans: string,
  key: string,
  i0: number,
  i1Ex: number
): { d: number; y: number; n: number } {
  let d = 0;
  let y = 0;
  let n = 0;
  for (let i = i0; i < i1Ex; i++) {
    const k = key.charAt(i);
    const a = ans.charAt(i);
    if (!k || k === " ") {
      n++;
      continue;
    }
    if (!a || a === " ") n++;
    else if (a === k) d++;
    else y++;
  }
  return { d, y, n };
}

export function formatDynHyphen(t: { d: number; y: number; n: number }): string {
  const d = Number(t?.d) || 0;
  const y = Number(t?.y) || 0;
  let netRaw = d - y / 4;
  if (!Number.isFinite(netRaw)) netRaw = 0;
  const net = Math.round(netRaw * 100) / 100;
  const netStr =
    Math.abs(net - Math.round(net)) > 1e-6 ? net.toFixed(2) : String(Math.round(net));
  return `${d}-${y}-${netStr}`;
}

export function sectionNetVal(t: { d: number; y: number; n: number }): number {
  return Math.round((t.d - t.y / 4) * 100) / 100;
}
