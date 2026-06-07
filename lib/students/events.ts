import { CATALOG_KEY, STORAGE_KEY } from "@/lib/students/constants";

export const STUDENTS_CHANGE_EVENT = "students:change";

export function dispatchStudentsChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(STUDENTS_CHANGE_EVENT));
  void import("@/lib/coach/actions/revalidate-dashboard").then((m) =>
    m.revalidateCoachDashboard()
  );
}

export function onStudentsChange(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const fn = () => handler();
  window.addEventListener(STUDENTS_CHANGE_EVENT, fn);
  const onStorage = (e: StorageEvent) => {
    if (
      e.key === STORAGE_KEY ||
      e.key === CATALOG_KEY ||
      e.key === "derecepanel_students_full_v1"
    ) {
      handler();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(STUDENTS_CHANGE_EVENT, fn);
    window.removeEventListener("storage", onStorage);
  };
}
