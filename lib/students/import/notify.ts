import { toast } from "sonner";

import { TOAST_ERROR_MS, TOAST_SUCCESS_MS } from "@/lib/students/import/constants";
import { IMPORT_ERROR_MESSAGES } from "@/lib/students/import/errors";
import type { ImportApiResponse } from "@/lib/students/import/types";

export type NotifyImportPayload = Pick<
  ImportApiResponse,
  "imported" | "skipped" | "errors"
>;

function formatErrorLines(errors: { row: number; reason: string }[], limit = 8): string {
  return errors
    .slice(0, limit)
    .map((e) => (e.row > 0 ? `Satır ${e.row}: ${e.reason}` : e.reason))
    .join("\n");
}

const toastBase = {
  success: { duration: TOAST_SUCCESS_MS, "aria-live": "polite" as const },
  error: { duration: TOAST_ERROR_MS, "aria-live": "polite" as const },
  info: { duration: TOAST_SUCCESS_MS, "aria-live": "polite" as const },
};

/** İçe aktarma sonucu için Türkçe sonner bildirimleri */
export function notifyImportResult(result: NotifyImportPayload) {
  const { imported, skipped, errors } = result;

  if (imported > 0 && skipped > 0) {
    toast.success(`${imported} kayıt eklendi, ${skipped} satır atlandı.`, {
      ...toastBase.success,
      description:
        errors.length > 0
          ? formatErrorLines(errors)
          : "Boş, örnek veya mükerrer satırlar atlandı.",
    });
    return;
  }

  if (imported > 0) {
    toast.success(`Başarılı. ${imported} öğrenci kaydedildi.`, toastBase.success);
    return;
  }

  if (skipped > 0) {
    toast.warning(`${skipped} satır atlandı; yeni kayıt eklenmedi.`, {
      ...toastBase.info,
      description: errors.length > 0 ? formatErrorLines(errors) : undefined,
    });
    return;
  }

  toast.error(IMPORT_ERROR_MESSAGES.NO_VALID_ROWS, toastBase.error);
}

export function notifyImportError(message: string) {
  toast.error(message, toastBase.error);
}

export function notifySessionExpired() {
  toast.error("Oturum süresi doldu.", toastBase.error);
}

export function notifyServerImportFailed() {
  toast.error("İçe aktarma başarısız. Tekrar deneyin.", toastBase.error);
}
