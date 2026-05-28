/** ESKİ stripTeacherUiFromTmA4Clone + applyExportLayoutToTmA4Clone */
export function stripTeacherUiFromClone(clone: HTMLElement) {
  clone.querySelectorAll(".teacher-only-ui").forEach((el) => el.remove());
  clone.querySelectorAll(".tm-delete-page-btn").forEach((el) => el.remove());
  clone.querySelectorAll(".tm-q-crop-target").forEach((el) => el.remove());
}

export function applyExportLayoutToClone(clone: HTMLElement) {
  clone.style.transform = "none";
  clone.style.width = "210mm";
  clone.style.marginLeft = "0";
  clone.style.marginRight = "0";
  clone.style.background = "#ffffff";
}

export function sanitizeA4CloneForExport(clone: HTMLElement) {
  stripTeacherUiFromClone(clone);
  applyExportLayoutToClone(clone);
  clone.removeAttribute("id");
}

export function prepareA4CloneForPrint(clone: HTMLElement) {
  stripTeacherUiFromClone(clone);
  applyExportLayoutToClone(clone);
}

export function slugifyPdfName(title: string) {
  const s = (title || "test")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9ğüşıöçĞÜŞİÖÇ]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return (s || "test") + ".pdf";
}
