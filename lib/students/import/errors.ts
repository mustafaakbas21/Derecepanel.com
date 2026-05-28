export type ImportErrorCode =
  | "INVALID_FILE_TYPE"
  | "FILE_TOO_LARGE"
  | "EMPTY_FILE"
  | "NO_VALID_ROWS"
  | "NO_SHEET"
  | "FILE_READ_ERROR"
  | "EXCEL_READ_ERROR"
  | "UNKNOWN_TEMPLATE";

export const IMPORT_ERROR_MESSAGES: Record<ImportErrorCode, string> = {
  INVALID_FILE_TYPE: "Lütfen Excel (.xlsx) veya CSV dosyası seçin.",
  FILE_TOO_LARGE: "Dosya boyutu 5 MB sınırını aşıyor.",
  EMPTY_FILE: "Dosyada satır bulunamadı.",
  NO_VALID_ROWS: "Dosyada geçerli satır bulunamadı.",
  NO_SHEET: "Çalışma sayfası bulunamadı.",
  FILE_READ_ERROR: "Dosya okunamadı.",
  EXCEL_READ_ERROR: "Excel okunamadı.",
  UNKNOWN_TEMPLATE: "Tanınmayan şablon. Örnek Excel şablonunu kullanın.",
};

export class ImportError extends Error {
  readonly code: ImportErrorCode;

  constructor(code: ImportErrorCode, message?: string) {
    super(message ?? IMPORT_ERROR_MESSAGES[code]);
    this.name = "ImportError";
    this.code = code;
  }
}

export function isImportError(e: unknown): e is ImportError {
  return e instanceof ImportError;
}

export function mapImportError(e: unknown): string {
  if (isImportError(e)) return e.message;
  if (e instanceof Error && e.message) return e.message;
  return IMPORT_ERROR_MESSAGES.FILE_READ_ERROR;
}
