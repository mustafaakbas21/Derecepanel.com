import {
  ALLOWED_IMPORT_EXTENSIONS,
  MAX_IMPORT_FILE_BYTES,
} from "@/lib/students/import/constants";
import { ImportError } from "@/lib/students/import/errors";

export function getFileExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot).toLowerCase() : "";
}

export function isAllowedImportFile(file: File): boolean {
  const ext = getFileExtension(file.name);
  return (ALLOWED_IMPORT_EXTENSIONS as readonly string[]).includes(ext);
}

export function validateImportFile(file: File): void {
  if (!isAllowedImportFile(file)) {
    throw new ImportError("INVALID_FILE_TYPE");
  }
  if (file.size > MAX_IMPORT_FILE_BYTES) {
    throw new ImportError("FILE_TOO_LARGE");
  }
  if (file.size === 0) {
    throw new ImportError("EMPTY_FILE");
  }
}
