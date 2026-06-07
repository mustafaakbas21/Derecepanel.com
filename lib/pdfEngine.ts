/**
 * Otonom sınav PDF analizi — sunucu giriş noktası.
 */

import { getExamLayout } from "@/lib/exams/exam-layout";
import type { SinavTipi } from "@/lib/exams/types";

import {
  detectBookletType,
  parseBookletRemap,
  resolveAnswerKey,
  findAnswerKeyStartIndex,
} from "@/lib/pdfEngine/answer-key";
import { extractPdfPages } from "@/lib/pdfEngine/extract";
import {
  buildTopicIndex,
  matchTopicForSubject,
  splitQuestionChunks,
  subjectLabelFor,
} from "@/lib/pdfEngine/topics";

export type { PdfParseRow, PdfParseResult } from "@/lib/pdfEngine/types";
export { PDF_ENGINE_MAX_BYTES } from "@/lib/pdfEngine/types";

export { parseAnswerKeyFromText, detectBookletType, parseBookletRemap } from "@/lib/pdfEngine/answer-key";

import type { PdfParseResult, PdfParseRow } from "@/lib/pdfEngine/types";

export async function parseExamPdf(buffer: Buffer, sinav: SinavTipi): Promise<PdfParseResult> {
  const layout = getExamLayout(sinav);
  const warnings: string[] = [];
  const pages = await extractPdfPages(buffer);
  const fullText = pages.map((p) => p.text).join("\n");

  if (!fullText.trim()) {
    warnings.push("PDF metin katmanı okunamadı. Taranmış (görüntü) PDF olabilir.");
    return emptyResult(sinav, pages.length, warnings);
  }

  const { answers, method: answerKeyMethod } = resolveAnswerKey(pages, fullText, layout.n);

  const booklet = detectBookletType(fullText);
  let finalAnswers = answers;

  if (booklet === "B") {
    const tail = pages.slice(-6).map((p) => p.text).join("\n");
    const remap = parseBookletRemap(tail, layout.n);
    if (remap) {
      const remapped = new Map<number, string>();
      for (const [from, to] of remap) {
        const letter = answers.get(from);
        if (letter) remapped.set(to, letter);
      }
      if (remapped.size > answers.size * 0.4) finalAnswers = remapped;
      else warnings.push("Kitapçık B eşleme tablosu tam uygulanamadı.");
    }
  }

  const keyStart = findAnswerKeyStartIndex(fullText);
  const bodyText = keyStart >= 0 ? fullText.slice(0, keyStart) : fullText.slice(0, Math.floor(fullText.length * 0.85));
  const chunks = splitQuestionChunks(bodyText, layout.n);
  const topicIndex = buildTopicIndex(sinav);

  const rows: PdfParseRow[] = [];
  let topicsMatched = 0;

  for (let qi = 0; qi < layout.n; qi++) {
    const qNo = qi + 1;
    const cell = layout.byIndex[qi];
    const subjectId = cell?.subjectId || "";
    const cevap = finalAnswers.get(qNo) || "";

    const chunk = chunks.get(qNo) || "";
    const topicHit = matchTopicForSubject(chunk, subjectId, topicIndex);

    let confidence = 0;
    if (cevap) confidence += 40;
    if (topicHit.topicId) {
      confidence += topicHit.confidence * 0.55;
      topicsMatched++;
    } else if (topicHit.confidence > 0) {
      confidence += topicHit.confidence * 0.25;
    }

    if (!cevap && !topicHit.topicId) confidence = 8;
    else if (!topicHit.topicId) confidence = Math.max(confidence, cevap ? 52 : 15);

    rows.push({
      soruNo: qNo,
      cevap,
      subjectId,
      subjectLabel: subjectLabelFor(subjectId, cell?.sectionTitle),
      topicId: topicHit.topicId,
      topicLabel: topicHit.topicLabel,
      confidence: Math.min(100, Math.round(confidence)),
    });
  }

  const answerPct = finalAnswers.size / layout.n;
  if (answerPct < 0.2) {
    warnings.push(
      `Cevap anahtarında ${finalAnswers.size}/${layout.n} soru bulundu. PDF sonundaki anahtar tablosunun metin katmanı olduğundan emin olun.`
    );
  } else if (answerPct < 0.6) {
    warnings.push(
      `Cevap anahtarı kısmi (${finalAnswers.size}/${layout.n}). Eksikleri matriste elle tamamlayın.`
    );
  }

  if (topicsMatched < layout.n * 0.05) {
    warnings.push(
      "Konu eşlemesi bulunamadı; PDF’de konu etiketi yoksa yalnızca cevaplar aktarılır."
    );
  }

  return {
    rows,
    sinav,
    booklet,
    warnings,
    meta: {
      pageCount: pages.length,
      answersFound: finalAnswers.size,
      topicsMatched,
      answerKeyMethod,
    },
  };
}

function emptyResult(
  sinav: SinavTipi,
  pageCount: number,
  warnings: string[]
): PdfParseResult {
  const layout = getExamLayout(sinav);
  const rows: PdfParseRow[] = layout.byIndex.map((cell, qi) => ({
    soruNo: qi + 1,
    cevap: "",
    subjectId: cell.subjectId,
    subjectLabel: subjectLabelFor(cell.subjectId, cell.sectionTitle),
    topicId: "",
    topicLabel: "",
    confidence: 0,
  }));
  return {
    rows,
    sinav,
    booklet: null,
    warnings,
    meta: {
      pageCount,
      answersFound: 0,
      topicsMatched: 0,
      answerKeyMethod: "none",
    },
  };
}
