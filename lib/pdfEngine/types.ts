export type PdfParseRow = {
  soruNo: number;
  cevap: string;
  subjectId: string;
  subjectLabel: string;
  topicId: string;
  topicLabel: string;
  confidence: number;
};

export type PdfParseResult = {
  rows: PdfParseRow[];
  sinav: "TYT" | "AYT" | "YDT";
  booklet: "A" | "B" | null;
  warnings: string[];
  meta: {
    pageCount: number;
    answersFound: number;
    topicsMatched: number;
    answerKeyMethod: string;
  };
};

export const PDF_ENGINE_MAX_BYTES = 20 * 1024 * 1024;
export const LOW_CONFIDENCE_THRESHOLD = 60;
