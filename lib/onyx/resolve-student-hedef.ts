import { parseGoal } from "@/lib/students/constants";

export type ResolvedStudentHedef = {
  universite?: string;
  bolum?: string;
  aciklama?: string;
  /** Görüntüleme: "Üniversite — Bölüm" */
  label: string;
};

/** Panel / Onyx bağlamından öğrenci hedefini tek kaynaktan çözümler */
export function resolveStudentHedef(contextData: unknown): ResolvedStudentHedef | null {
  if (!contextData || typeof contextData !== "object") return null;
  const ctx = contextData as Record<string, unknown>;
  const ogrenci = ctx.ogrenci;
  if (!ogrenci || typeof ogrenci !== "object") return null;

  const o = ogrenci as Record<string, unknown>;
  let universite = "";
  let bolum = "";
  let aciklama = "";

  const hedef = o.hedef;
  if (hedef && typeof hedef === "object") {
    const h = hedef as Record<string, unknown>;
    universite = String(h.universite ?? "").trim();
    bolum = String(h.bolum ?? "").trim();
    aciklama = String(h.aciklama ?? "").trim();
  }

  if (!universite) universite = String(o.targetUniversity ?? "").trim();
  if (!bolum) bolum = String(o.targetDepartment ?? "").trim();
  if (!aciklama) aciklama = String(o.goal ?? ctx.goal ?? "").trim();

  if (aciklama && (!universite || !bolum)) {
    const parsed = parseGoal(aciklama);
    if (!universite && parsed.university) universite = parsed.university;
    if (!bolum && parsed.department) bolum = parsed.department;
  }

  if (!universite && !bolum && !aciklama) return null;

  const label =
    universite && bolum
      ? `${universite} — ${bolum}`
      : bolum || universite || aciklama;

  return {
    universite: universite || undefined,
    bolum: bolum || undefined,
    aciklama: aciklama || undefined,
    label,
  };
}
