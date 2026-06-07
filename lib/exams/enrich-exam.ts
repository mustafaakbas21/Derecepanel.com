import { computeMatrixPct } from "@/lib/exams/exam-evaluate";
import { getExamQuestionCount } from "@/lib/exams/exam-layout";
import { readExamResults } from "@/lib/exams/exam-results-storage";
import type { KurumDeneme, KurumDenemeDurum, SinavTipi } from "@/lib/exams/types";

function countExamResultsParticipants(examId: string): number {
  const want = String(examId);
  const seen: Record<string, boolean> = {};
  let n = 0;
  for (const r of readExamResults()) {
    if (!r || String(r.examId) !== want) continue;
    const sid = String(r.studentId || r.studentCode || "");
    if (!sid || seen[sid]) continue;
    seen[sid] = true;
    n++;
  }
  return n;
}

export function deriveDurum(
  matrixPct: number,
  pdfYuklu: boolean,
  explicit?: KurumDenemeDurum
): KurumDenemeDurum {
  if (explicit === "tamamlandi") return "tamamlandi";
  if (matrixPct >= 100 && pdfYuklu) return "aktif";
  return "taslak";
}

export function isPdfYuklu(exam: Pick<KurumDeneme, "pdfUrl" | "pdfName" | "pdfYuklu">): boolean {
  if (exam.pdfYuklu != null) return !!exam.pdfYuklu;
  return !!(exam.pdfUrl && String(exam.pdfUrl).length) || !!(exam.pdfName && String(exam.pdfName).length);
}

export function enrichKurumDeneme(item: KurumDeneme): KurumDeneme {
  const n = item.soruSayisi || getExamQuestionCount(item.sinav as SinavTipi);
  const pct =
    item.matrixPct != null && item.matrixPct !== undefined
      ? Number(item.matrixPct)
      : computeMatrixPct(item.cevaplar, n);
  const pdfYuklu = isPdfYuklu(item);
  const durum = deriveDurum(pct, pdfYuklu, item.durum);
  const storedAtanan = Number(item.atanan) || 0;
  const fromResults = countExamResultsParticipants(item.id);
  return {
    ...item,
    soruSayisi: n,
    matrixPct: pct,
    pdfYuklu,
    durum,
    atanan: Math.max(storedAtanan, fromResults),
  };
}

export function durumLabel(code: string): string {
  if (code === "aktif") return "Yayında";
  if (code === "tamamlandi") return "Tamamlandı";
  return "Taslak";
}

export function layoutHint(sinav: SinavTipi): string {
  if (sinav === "TYT") return "TYT: 120 soru (ÖSYM)";
  if (sinav === "AYT") return "AYT: 160 soru (ÖSYM)";
  return "YDT: 80 soru (ÖSYM)";
}
