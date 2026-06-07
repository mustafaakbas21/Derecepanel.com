import { getAnswerKeyForExamId } from "@/lib/analiz/hydrate";
import { getResolvedExamMatrix } from "@/lib/exams/exam-matrix";
import { findExamById } from "@/lib/exams/exam-storage";
import type { MergedExam } from "@/lib/exams/types";

export type AnalizDataQuality = {
  hasResults: boolean;
  hasAnswerKey: boolean;
  hasKonuMatrix: boolean;
  konuFilledCount: number;
  questionCount: number;
  canTopicCharts: boolean;
  canPriorityList: boolean;
  banner: "ok" | "missing-konu" | "missing-key" | "missing-results";
  message: string;
};

export function examKonuFilledCount(exam: MergedExam | undefined): number {
  if (!exam) return 0;
  const konu = Array.isArray(exam.konu) ? exam.konu : [];
  const yazi = Array.isArray(exam.konuYazi) ? exam.konuYazi : [];
  const n = Math.max(konu.length, yazi.length, exam.soruSayisi || 0);
  let filled = 0;
  for (let i = 0; i < n; i++) {
    if (String(konu[i] ?? "").trim() || String(yazi[i] ?? "").trim()) filled++;
  }
  return filled;
}

export function examHasMeaningfulKonu(exam: MergedExam | undefined): boolean {
  if (!exam) return false;
  const n = exam.soruSayisi || getResolvedExamMatrix(exam.id)?.questionCount || 0;
  if (!n) return examKonuFilledCount(exam) >= 3;
  return examKonuFilledCount(exam) / n >= 0.15;
}

/** Konu/drilldown grafikleri için matrix’te anlamlı konu adı var mı */
export function matrixHasTopicLabels(examId: string): boolean {
  const mx = getResolvedExamMatrix(examId);
  if (!mx?.questions?.length) return false;
  const meaningful = mx.questions.filter((q) => {
    const t = String(q.topicName || "").trim();
    return t && t !== "Genel" && t !== "—" && !/^Soru \d+$/i.test(t);
  });
  return meaningful.length >= Math.min(3, mx.questions.length * 0.1);
}

export function getAnalizDataQuality(
  examId: string,
  resultCount: number
): AnalizDataQuality {
  const exam = findExamById(examId) ?? undefined;
  const key = getAnswerKeyForExamId(examId).replace(/\s/g, "");
  const hasAnswerKey = key.length > 0;
  const hasKonuMatrix = examHasMeaningfulKonu(exam);
  const konuFilledCount = examKonuFilledCount(exam);
  const questionCount =
    exam?.soruSayisi || getResolvedExamMatrix(examId)?.questionCount || 0;
  const hasResults = resultCount > 0;
  const canTopicCharts =
    hasResults && hasAnswerKey && (hasKonuMatrix || matrixHasTopicLabels(examId));
  const canPriorityList = hasResults && hasAnswerKey;

  let banner: AnalizDataQuality["banner"] = "ok";
  let message =
    "Konu analizi: deneme takvimindeki soru konuları + optik cevaplar + cevap anahtarı.";

  if (!hasResults) {
    banner = "missing-results";
    message =
      "Bu sınav için sonuç yok. Deneme Sonuçları Yükleme ile optik aktarın.";
  } else if (!hasAnswerKey) {
    banner = "missing-key";
    message =
      "Cevap anahtarı eksik — Kurum/Global Deneme Takvimi’nde cevaplar[] doldurun. Grafikler yalnızca D/Y/B özeti gösterilir.";
  } else if (!hasKonuMatrix && !matrixHasTopicLabels(examId)) {
    banner = "missing-konu";
    message = `Konu matrisi eksik (${konuFilledCount}/${questionCount || "?"} soru). Takvimde soru konularını doldurun; aksi halde grafikler D/Y/B özeti veya ders bloklarıyla sınırlı kalır.`;
  }

  return {
    hasResults,
    hasAnswerKey,
    hasKonuMatrix,
    konuFilledCount,
    questionCount,
    canTopicCharts,
    canPriorityList,
    banner,
    message,
  };
}
