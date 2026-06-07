import type { KurumDeneme } from "@/lib/exams/types";
import {
  blobToDataUrl,
  fetchBlobFromStorage,
} from "@/lib/appwrite/blob-client";
import {
  encodeCloudRef,
  isCloudRef,
  isDataUrl,
  parseCloudRef,
} from "@/lib/appwrite/storage-refs";

import { panelGetItem, panelSetItem } from "@/lib/panel-store";

export const KURUM_DENEME_PDF_KEY = "kurum_deneme_pdf_v1";

const pdfUrlCache = new Map<string, string>();

function readPdfMap(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(panelGetItem(KURUM_DENEME_PDF_KEY) || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writePdfMap(map: Record<string, string>) {
  if (typeof window === "undefined") return;
  panelSetItem(KURUM_DENEME_PDF_KEY, JSON.stringify(map));
}

function mapEntryToCloudRef(value: string): KurumDeneme["pdfCloudRef"] | undefined {
  const parsed = parseCloudRef(value);
  return parsed ?? undefined;
}

/** PDF data URL ana listeyi şişirmesin — ayrı depoda tutulur */
export function persistKurumExamPdf(id: string, pdfUrl?: string) {
  if (!id) return;
  const map = readPdfMap();
  if (pdfUrl && String(pdfUrl).length) map[id] = pdfUrl;
  else delete map[id];
  writePdfMap(map);
}

export function attachKurumExamPdf(exam: KurumDeneme): KurumDeneme {
  if (exam.pdfUrl) return exam;
  const raw = readPdfMap()[exam.id];
  if (!raw) return exam;

  if (isCloudRef(raw)) {
    const ref = mapEntryToCloudRef(raw);
    return ref
      ? { ...exam, pdfCloudRef: ref, pdfYuklu: true }
      : exam;
  }

  return { ...exam, pdfUrl: raw };
}

/** Kayıt öncesi pdfUrl'i ana JSON'dan ayır */
export function stripKurumExamPdf(exam: KurumDeneme): KurumDeneme {
  if (exam.pdfUrl) persistKurumExamPdf(exam.id, exam.pdfUrl);
  if (exam.pdfCloudRef) {
    persistKurumExamPdf(
      exam.id,
      encodeCloudRef(exam.pdfCloudRef.bucketId, exam.pdfCloudRef.fileId)
    );
  }
  const { pdfUrl: _drop, pdfCloudRef: _ref, ...rest } = exam;
  return rest as KurumDeneme;
}

export async function hydrateKurumExamPdfAsync(exam: KurumDeneme): Promise<KurumDeneme> {
  if (exam.pdfUrl && isDataUrl(exam.pdfUrl)) return exam;

  const cacheKey = exam.pdfCloudRef
    ? `${exam.pdfCloudRef.bucketId}:${exam.pdfCloudRef.fileId}`
    : exam.id;

  const cached = pdfUrlCache.get(cacheKey);
  if (cached) return { ...exam, pdfUrl: cached };

  let ref = exam.pdfCloudRef;
  if (!ref) {
    const raw = readPdfMap()[exam.id];
    if (raw && isCloudRef(raw)) ref = mapEntryToCloudRef(raw);
  }

  if (!ref) {
    const raw = readPdfMap()[exam.id];
    if (raw && isDataUrl(raw)) return { ...exam, pdfUrl: raw };
    return exam;
  }

  try {
    const blob = await fetchBlobFromStorage(ref.bucketId, ref.fileId);
    const dataUrl = await blobToDataUrl(blob);
    pdfUrlCache.set(cacheKey, dataUrl);
    return { ...exam, pdfUrl: dataUrl, pdfCloudRef: ref };
  } catch {
    return exam;
  }
}

export async function getKurumExamPdfDataUrl(examId: string): Promise<string | undefined> {
  const exam = await hydrateKurumExamPdfAsync({ id: examId } as KurumDeneme);
  return exam.pdfUrl;
}

export function clearKurumPdfCache() {
  pdfUrlCache.clear();
}
