import { appToast } from "@/lib/notify";

/** Test Maker — appToast üzerinden (görünür sonner) */
export const tmToast = {
  success: appToast.success,
  error: appToast.error,
  warning: appToast.warning,

  taramaSaved: (name: string, n: number, isEdit?: boolean) =>
    appToast.success(
      isEdit ? "Tarama güncellendi" : "Başarıyla arşivlendi",
      `${name} · ${n} soru`
    ),
  taramaLoaded: (name: string) => appToast.success("Arşivden yüklendi", name),
  sentToStudent: (title: string, n: number) =>
    appToast.success("Öğrenci kütüphanesine gönderildi", `${title} · ${n} soru`),
  matrixSaved: (filled: number, total: number) =>
    appToast.success(`Matrix kaydedildi: ${filled}/${total}`),
  pdfUploaded: () => appToast.success("PDF yüklendi"),
  needQuestions: () => appToast.error("Önce soru ekleyin"),
  needAnswerKey: () => appToast.error("Cevap anahtarı yok", "Şıkları işaretleyin"),
  needStudent: () => appToast.error("Öğrenci seçin"),
  pdfTooBig: () => appToast.error("Dosya çok büyük", "Maksimum 100 MB"),
  pdfError: (msg: string) => appToast.error("PDF hatası", msg),
  storageFull: () => appToast.storageFull(),
  cloudDisabled: () =>
    appToast.error("Bulut PDF yapılandırılmadı", "APPWRITE veya S3 env gerekli"),
  poolAdded: (n: number) => appToast.poolAddedToTest(n),
  poolSavedToHavuz: (n: number) => appToast.poolSavedToHavuz(n),
  resetDone: () => appToast.success("Stüdyo sıfırlandı"),
};
