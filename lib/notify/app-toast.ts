import { toast as sonner, type ExternalToast } from "sonner";

/** Tüm panel bildirimleri — tek giriş noktası (Sonner) */
export const TOAST_SUCCESS_MS = 5000;
export const TOAST_ERROR_MS = 6000;
export const TOAST_Z_INDEX = 99999;

export type ToastOptions = ExternalToast;

const successDefaults: ExternalToast = { duration: TOAST_SUCCESS_MS };
const errorDefaults: ExternalToast = { duration: TOAST_ERROR_MS };

function withSuccess(opts?: ToastOptions): ExternalToast {
  return { ...successDefaults, ...opts };
}

function withError(opts?: ToastOptions): ExternalToast {
  return { ...errorDefaults, ...opts };
}

/**
 * Standart toast API — doğrudan `sonner` import etmeyin.
 * Görünüm: `components/providers.tsx` → `AppToaster`
 */
export const toast = {
  success(message: string, opts?: ToastOptions) {
    return sonner.success(message, withSuccess(opts));
  },
  error(message: string, opts?: ToastOptions) {
    return sonner.error(message, withError(opts));
  },
  warning(message: string, opts?: ToastOptions) {
    return sonner.warning(message, withSuccess(opts));
  },
  info(message: string, opts?: ToastOptions) {
    return sonner.info(message, withSuccess(opts));
  },
  /** Nötr bilgi (şablon değişti, liste boş vb.) */
  message(message: string, opts?: ToastOptions) {
    return sonner.message(message, withSuccess(opts));
  },
  dismiss: sonner.dismiss,
  promise: sonner.promise,
};

export const appToast = {
  success(title: string, description?: string) {
    toast.success(title, description ? { description } : undefined);
  },

  error(title: string, description?: string) {
    toast.error(title, description ? { description } : undefined);
  },

  warning(title: string, description?: string) {
    toast.warning(title, description ? { description } : undefined);
  },

  info(title: string, description?: string) {
    toast.info(title, description ? { description } : undefined);
  },

  message(title: string, description?: string) {
    toast.message(title, description ? { description } : undefined);
  },

  /** Soru havuzu */
  poolSavedToHavuz(count: number) {
    const n = Math.max(0, count);
    if (n === 0) {
      appToast.warning("Kaydedilecek soru yok");
      return;
    }
    appToast.success(
      n === 1 ? "Soru havuza kaydedildi" : `${n} soru havuza kaydedildi`,
      "Soru Havuzu sayfasından görüntüleyebilirsiniz"
    );
  },

  poolAddedToTest(count: number) {
    appToast.success(`${count} soru teste eklendi`);
  },

  cropAddedToGallery(index: number) {
    appToast.success(`Soru #${index} galeriye eklendi — cevabı karttan seçin`);
  },

  autoScanDone(count: number, aborted?: boolean) {
    if (aborted) {
      appToast.warning(
        count > 0 ? `${count} soru bulundu (tarama durduruldu)` : "Tarama durduruldu"
      );
      return;
    }
    if (count === 0) {
      appToast.warning(
        "Otomatik tarama soru bulamadı",
        "Tek/çift sütun modunu değiştirin veya manuel kırpın"
      );
      return;
    }
    appToast.success(`${count} soru otomatik tarandı`, "Sağ panelden kontrol edin");
  },

  /** Öğrenci */
  studentSaved(isEdit?: boolean) {
    appToast.success(isEdit ? "Öğrenci güncellendi" : "Öğrenci kaydedildi");
  },

  studentDeleted() {
    appToast.success("Öğrenci silindi");
  },

  studentsBulkDeleted(count: number) {
    appToast.success(`${count} öğrenci silindi`);
  },

  /** Deneme / sonuç */
  examCreated(isEdit?: boolean) {
    appToast.success(isEdit ? "Deneme güncellendi" : "Deneme oluşturuldu");
  },

  examDeleted() {
    appToast.success("Deneme silindi");
  },

  examResultsUploaded(count: number) {
    appToast.success(`${count} sonuç kaydı yüklendi`);
  },

  examRowsEvaluated(count: number) {
    appToast.success(`${count} satır değerlendirildi`);
  },

  examMatchSaved() {
    appToast.success("Eşleştirme kaydedildi");
  },

  storageFull() {
    appToast.error("Kayıt başarısız", "Depolama dolu olabilir");
  },
};
