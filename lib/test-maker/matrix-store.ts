import { STORAGE_KEYS } from "@/lib/test-maker/constants";
import type { MatrixBundle, MatrixQuestionRow } from "@/lib/test-maker/types";

import { panelGetItem, panelRemoveItem, panelSetItem } from "@/lib/panel-store";
export type LastMatrixSnapshot = {
  examKey: string;
  questions: MatrixQuestionRow[];
};

export function loadMatrixBundles(): Record<string, MatrixBundle> {
  if (typeof window === "undefined") return {};
  try {
    const raw = panelGetItem(STORAGE_KEYS.matrixBundle);
    return raw ? (JSON.parse(raw) as Record<string, MatrixBundle>) : {};
  } catch {
    return {};
  }
}

export function saveMatrixBundle(bundle: MatrixBundle) {
  const all = loadMatrixBundles();
  all[bundle.examKey] = bundle;
  panelSetItem(STORAGE_KEYS.matrixBundle, JSON.stringify(all));
  setLastMatrixSnapshot({
    examKey: bundle.examKey,
    questions: bundle.questions.slice(),
  });
}

export function createMatrixExamKey() {
  return `tmx-${Date.now().toString(36)}`;
}

export function setLastMatrixSnapshot(snapshot: LastMatrixSnapshot) {
  if (typeof window === "undefined") return;
  (window as unknown as { __testMakerLastMatrix?: LastMatrixSnapshot }).__testMakerLastMatrix =
    snapshot;
}

export function getLastMatrixSnapshot(): LastMatrixSnapshot | null {
  if (typeof window === "undefined") return null;
  const snap = (window as unknown as { __testMakerLastMatrix?: LastMatrixSnapshot })
    .__testMakerLastMatrix;
  return snap?.examKey ? snap : null;
}
