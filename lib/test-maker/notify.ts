import { toast } from "sonner";

const ok = { duration: 2600 };
const err = { duration: 3200 };

/** ESKİ tmToast parity — sonner */
export const tmToast = {
  success: (title: string, sub?: string) =>
    toast.success(title, { description: sub, ...ok }),
  error: (title: string, sub?: string) =>
    toast.error(title, { description: sub, ...err }),
  warning: (title: string, sub?: string) =>
    toast.warning(title, { description: sub, ...ok }),

  taramaSaved: (name: string, n: number, isEdit?: boolean) =>
    tmToast.success(
      isEdit ? "Tarama güncellendi" : "Başarıyla Arşivlendi",
      `${name} · ${n} soru`
    ),
  taramaLoaded: (name: string) =>
    tmToast.success("Arşivden yüklendi", name),
  sentToStudent: (title: string, n: number) =>
    tmToast.success("Öğrenci kütüphanesine gönderildi", `${title} · ${n} soru`),
  matrixSaved: (filled: number, total: number) =>
    tmToast.success(`Matrix kaydedildi: ${filled}/${total}`),
  pdfUploaded: () => tmToast.success("PDF yüklendi"),
  needQuestions: () => tmToast.error("Önce soru ekleyin"),
  needAnswerKey: () => tmToast.error("Cevap anahtarı yok", "Şıkları işaretleyin"),
  needStudent: () => tmToast.error("Öğrenci seçin"),
  pdfTooBig: () => tmToast.error("Dosya çok büyük", "Maksimum 100 MB"),
  pdfError: (msg: string) => tmToast.error("PDF hatası", msg),
  storageFull: () => tmToast.error("Kayıt başarısız", "Depolama dolu olabilir"),
  cloudDisabled: () =>
    tmToast.error("Bulut PDF yapılandırılmadı", "APPWRITE veya S3 env gerekli"),
  poolAdded: (n: number) => tmToast.success(`${n} soru teste eklendi`),
  resetDone: () => tmToast.success("Stüdyo sıfırlandı"),
};
