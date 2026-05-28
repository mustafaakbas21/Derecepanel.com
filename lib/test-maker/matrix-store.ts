import { STORAGE_KEYS } from "@/lib/test-maker/constants";
import type { MatrixBundle } from "@/lib/test-maker/types";

export function loadMatrixBundles(): Record<string, MatrixBundle> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.matrixBundle);
    return raw ? (JSON.parse(raw) as Record<string, MatrixBundle>) : {};
  } catch {
    return {};
  }
}

export function saveMatrixBundle(bundle: MatrixBundle) {
  const all = loadMatrixBundles();
  all[bundle.examKey] = bundle;
  localStorage.setItem(STORAGE_KEYS.matrixBundle, JSON.stringify(all));
  if (typeof window !== "undefined") {
    (window as unknown as { __testMakerLastMatrix?: MatrixBundle }).__testMakerLastMatrix =
      bundle;
  }
}

export function createMatrixExamKey() {
  return `tmx-${Date.now().toString(36)}`;
}
