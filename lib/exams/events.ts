import {
  EXAM_MATRIX_CHANGE,
  EXAM_MATRIX_KEY,
  EXAM_RESULTS_CHANGE,
  GLOBAL_DENEMELER_KEY,
  GLOBAL_DENEMELER_UPDATED,
  GLOBAL_ALIAS_KEY,
  GLOBAL_EXAMS_LIVE_KEY,
  KURUM_DENEMELER_KEY,
} from "@/lib/exams/constants";

export const EXAMS_CHANGE = "exams:change";

export function dispatchExamsChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EXAMS_CHANGE));
}

export function dispatchExamMatrixChange(examId?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(EXAM_MATRIX_CHANGE, { detail: { examId } })
  );
  dispatchExamsChange();
}

export function onExamMatrixChange(handler: (examId?: string) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const fn = (e: Event) => {
    const detail = (e as CustomEvent<{ examId?: string }>).detail;
    handler(detail?.examId);
  };
  window.addEventListener(EXAM_MATRIX_CHANGE, fn);
  const storageHandler = (e: StorageEvent) => {
    if (e.key === EXAM_MATRIX_KEY) handler();
  };
  window.addEventListener("storage", storageHandler);
  return () => {
    window.removeEventListener(EXAM_MATRIX_CHANGE, fn);
    window.removeEventListener("storage", storageHandler);
  };
}

export function dispatchExamResultsChange(examId?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(EXAM_RESULTS_CHANGE, { detail: { examId } })
  );
  void import("@/lib/coach/actions/revalidate-dashboard").then((m) =>
    m.revalidateCoachDashboard()
  );
}

export function onExamsChange(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const fn = () => handler();
  window.addEventListener(EXAMS_CHANGE, fn);
  const storageHandler = (e: StorageEvent) => {
    if (
      e.key === KURUM_DENEMELER_KEY ||
      e.key === "kurumsalExams" ||
      e.key === "exams" ||
      e.key === EXAM_MATRIX_KEY ||
      e.key === GLOBAL_EXAMS_LIVE_KEY ||
      e.key === GLOBAL_DENEMELER_KEY ||
      e.key === GLOBAL_ALIAS_KEY
    )
      handler();
  };
  window.addEventListener("storage", storageHandler);
  return () => {
    window.removeEventListener(EXAMS_CHANGE, fn);
    window.removeEventListener("storage", storageHandler);
  };
}

export function onExamResultsChange(handler: (examId?: string) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const fn = (e: Event) => {
    const detail = (e as CustomEvent<{ examId?: string }>).detail;
    handler(detail?.examId);
  };
  window.addEventListener(EXAM_RESULTS_CHANGE, fn);
  const storageHandler = (e: StorageEvent) => {
    if (
      e.key === "examResults" ||
      e.key === "kurum_denemeler_v1" ||
      e.key === "kurumsalExams"
    )
      handler();
  };
  window.addEventListener("storage", storageHandler);
  return () => {
    window.removeEventListener(EXAM_RESULTS_CHANGE, fn);
    window.removeEventListener("storage", storageHandler);
  };
}

export function onGlobalDenemelerUpdated(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const fn = () => handler();
  window.addEventListener(GLOBAL_DENEMELER_UPDATED, fn);
  const storageHandler = (e: StorageEvent) => {
    if (
      e.key === GLOBAL_EXAMS_LIVE_KEY ||
      e.key === GLOBAL_DENEMELER_KEY ||
      e.key === GLOBAL_ALIAS_KEY
    )
      handler();
  };
  window.addEventListener("storage", storageHandler);
  return () => {
    window.removeEventListener(GLOBAL_DENEMELER_UPDATED, fn);
    window.removeEventListener("storage", storageHandler);
  };
}
