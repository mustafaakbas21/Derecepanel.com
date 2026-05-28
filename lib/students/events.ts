export const STUDENTS_CHANGE_EVENT = "students:change";

export function dispatchStudentsChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(STUDENTS_CHANGE_EVENT));
}
