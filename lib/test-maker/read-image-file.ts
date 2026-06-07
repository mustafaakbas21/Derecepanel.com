/** Görsel dosyasını kalite kaybı olmadan data URL olarak okur (orijinal encoding korunur). */
export function readImageFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Dosya bir görsel değil"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Görsel okunamadı"));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Görsel okunamadı"));
    reader.readAsDataURL(file);
  });
}
