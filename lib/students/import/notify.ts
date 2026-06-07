import { appToast } from "@/lib/notify";
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

/** İçe aktarma sonucu bildirimleri */
export function notifyImportResult(result: NotifyImportPayload) {
  const { imported, skipped, errors } = result;

  if (imported > 0 && skipped > 0) {
    appToast.success(
      `${imported} kayıt eklendi, ${skipped} satır atlandı.`,
      errors.length > 0
        ? formatErrorLines(errors)
        : "Boş, örnek veya mükerrer satırlar atlandı."
    );
    return;
  }

  if (imported > 0) {
    appToast.success(`Başarılı. ${imported} öğrenci kaydedildi.`);
    return;
  }

  if (skipped > 0) {
    appToast.warning(
      `${skipped} satır atlandı; yeni kayıt eklenmedi.`,
      errors.length > 0 ? formatErrorLines(errors) : undefined
    );
    return;
  }

  appToast.error(IMPORT_ERROR_MESSAGES.NO_VALID_ROWS);
}

export function notifyImportError(message: string) {
  appToast.error(message);
}

export function notifySessionExpired() {
  appToast.error("Oturum süresi doldu.");
}

export function notifyServerImportFailed() {
  appToast.error("İçe aktarma başarısız. Tekrar deneyin.");
}
