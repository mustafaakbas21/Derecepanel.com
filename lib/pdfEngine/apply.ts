import { getExamLayout } from "@/lib/exams/exam-layout";
import { encodeKonuCell } from "@/lib/exams/konu-cell";
import { matchTopicLabel } from "@/lib/exams/topic-match";
import { getConcepts, getTopicOptions } from "@/lib/mufredat";
import type { SinavTipi } from "@/lib/exams/types";

import { LOW_CONFIDENCE_THRESHOLD, type PdfParseRow } from "@/lib/pdfEngine/types";

type MatrixSlice = {
  cevaplar: string[];
  zorluk: string[];
  konu: string[];
  konuYazi: string[];
};

function parseAnswerLetter(raw: string): string {
  const m = String(raw || "")
    .trim()
    .toUpperCase()
    .match(/[ABCDE]/);
  return m ? m[0] : "";
}

/** Önizleme satırlarını sınav matrisine yazar (istemci güvenli). */
export function applyPdfRowsToMatrix(
  rows: PdfParseRow[],
  sinav: SinavTipi,
  current: MatrixSlice
): MatrixSlice {
  const layout = getExamLayout(sinav);
  const cevaplar = [...current.cevaplar];
  const zorluk = [...current.zorluk];
  const konu = [...current.konu];
  const konuYazi = [...current.konuYazi];

  for (const row of rows) {
    const qi = row.soruNo - 1;
    if (qi < 0 || qi >= layout.n) continue;
    const subjectId = layout.byIndex[qi]?.subjectId || row.subjectId || "";

    const ans = parseAnswerLetter(row.cevap);
    if (ans) cevaplar[qi] = ans;

    if (!subjectId) continue;

    let topicId = row.topicId;
    if (!topicId && row.topicLabel) {
      topicId = matchTopicLabel(row.topicLabel, getTopicOptions(subjectId));
    }

    if (topicId) {
      const concepts = getConcepts(subjectId, topicId);
      const conceptId = concepts[0]?.id || topicId;
      konu[qi] = encodeKonuCell({
        subjectId,
        topicId,
        conceptId,
      });
      konuYazi[qi] = "";
    } else if (row.topicLabel && row.confidence >= LOW_CONFIDENCE_THRESHOLD) {
      konuYazi[qi] = row.topicLabel;
      konu[qi] = encodeKonuCell({ subjectId });
    }
  }

  return { cevaplar, zorluk, konu, konuYazi };
}

export function isLowConfidenceRow(row: PdfParseRow): boolean {
  return (
    row.confidence < LOW_CONFIDENCE_THRESHOLD ||
    (!row.topicId && !row.topicLabel && !!row.cevap)
  );
}
