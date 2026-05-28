import type { TemplateId } from "@/lib/test-maker/types";

/** ESKİ applyTemplate */
export function applyTemplate(tpl: TemplateId, name: string) {
  const page = document.getElementById("tm-a4-page");
  if (page) page.setAttribute("data-tpl", tpl);

  const label = document.getElementById("tm-tpl-active-name");
  if (label) label.textContent = name;

  document.querySelectorAll(".tm-tpl-card").forEach((btn) => {
    const el = btn as HTMLElement;
    const isActive = el.getAttribute("data-tpl") === tpl;
    el.style.background = isActive ? "#f1f5f9" : "transparent";
    el.style.borderColor = isActive ? "#0f172a" : "transparent";
  });
}

export function initDefaultTemplate() {
  applyTemplate("derece", "Derece Kurumsal");
}
