const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export type OnyxImagePayload = {
  base64: string;
  mimeType: string;
  dataUrl: string;
};

export async function readImageFileAsBase64(file: File): Promise<OnyxImagePayload> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Yalnızca görsel dosyaları yüklenebilir.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Görsel en fazla 4 MB olabilir.");
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Görsel okunamadı."));
    reader.readAsDataURL(file);
  });

  const match = /^data:([^;]+);base64,(.+)$/i.exec(dataUrl);
  if (!match) {
    throw new Error("Görsel formatı desteklenmiyor.");
  }

  return {
    mimeType: match[1],
    base64: match[2],
    dataUrl,
  };
}
