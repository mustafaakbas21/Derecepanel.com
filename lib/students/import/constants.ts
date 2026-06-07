export const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024; // 5MB
export const MAX_IMPORT_ROWS = 500;

export const ALLOWED_IMPORT_EXTENSIONS = [".xlsx", ".xls", ".csv"] as const;

export { TOAST_ERROR_MS, TOAST_SUCCESS_MS } from "@/lib/notify";
