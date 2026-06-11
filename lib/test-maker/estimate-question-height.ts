import { FALLBACK_QUESTION_HEIGHT_PX } from "@/lib/test-maker/paginate";

/** A4 soru sütunu yaklaşık iç genişliği (210mm sayfa, padding + gap sonrası yarım sütun) */
export const TM_COLUMN_CONTENT_WIDTH_PX = 349;

/** Soru kartı sabit chrome: başlık, padding, çözüm alanı (şık seçici hariç) */
export const TM_QUESTION_CHROME_PX = 116;

/**
 * Görsel boyutuna göre soru yüksekliği tahmini — DOM ölçümü gelene kadar dizgi için.
 */
export function estimateQuestionHeightFromImage(
  imageDataUrl: string,
  columnWidthPx: number = TM_COLUMN_CONTENT_WIDTH_PX
): Promise<number> {
  return new Promise((resolve) => {
    if (!imageDataUrl) {
      resolve(FALLBACK_QUESTION_HEIGHT_PX);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const naturalW = img.naturalWidth || columnWidthPx;
      const naturalH = img.naturalHeight || columnWidthPx;
      const scale = columnWidthPx / naturalW;
      const imagePx = Math.ceil(naturalH * scale);
      resolve(TM_QUESTION_CHROME_PX + imagePx);
    };
    img.onerror = () => resolve(FALLBACK_QUESTION_HEIGHT_PX);
    img.src = imageDataUrl;
  });
}
