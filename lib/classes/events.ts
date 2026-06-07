export const CLASSES_CHANGE_EVENT = "classes:change";

export function dispatchClassesChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CLASSES_CHANGE_EVENT));
}

export function onClassesChange(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const fn = () => handler();
  window.addEventListener(CLASSES_CHANGE_EVENT, fn);
  return () => window.removeEventListener(CLASSES_CHANGE_EVENT, fn);
}
