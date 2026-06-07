/**
 * PDF kırpma çıktısı ile aynı render hattı: canvas → PNG, beyaz zemin, yüksek kalite.
 * Görsel yükleme ve havuzdan ekleme önizleme/A4 ölçümü bu URL ile uyumlu kalır.
 */

/** A4 tek sütun önizleme genişliği (ölçüm + render) */
export const TM_COLUMN_RENDER_MAX_WIDTH_PX = 720;

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Görsel yüklenemedi"));
    img.src = dataUrl;
  });
}

/**
 * Ham görseli PDF kırpma ile aynı formatta hazırlar (PNG data URL).
 * Çok geniş görseller sütun genişliğine orantılı küçültülür; yükseklik korunur.
 */
export async function prepareQuestionImageForRender(
  dataUrl: string,
  maxWidthPx: number = TM_COLUMN_RENDER_MAX_WIDTH_PX
): Promise<string> {
  if (!dataUrl.startsWith("data:image/")) {
    throw new Error("Geçersiz görsel");
  }

  const img = await loadImage(dataUrl);
  const naturalW = img.naturalWidth || img.width;
  const naturalH = img.naturalHeight || img.height;
  if (naturalW < 1 || naturalH < 1) {
    throw new Error("Görsel boyutu okunamadı");
  }

  const scale = naturalW > maxWidthPx ? maxWidthPx / naturalW : 1;
  const outW = Math.max(1, Math.round(naturalW * scale));
  const outH = Math.max(1, Math.round(naturalH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas oluşturulamadı");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, outW, outH);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, outW, outH);

  const png = canvas.toDataURL("image/png", 1);
  if (!png.startsWith("data:image/png")) {
    throw new Error("Görsel render edilemedi");
  }
  return png;
}
