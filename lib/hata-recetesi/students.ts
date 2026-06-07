import { loadStudentsFull } from "@/lib/students/storage";

export type StudentRow = {
  canonical: string;
  label: string;
  needle: string;
  ogrenciId: string;
  studentCode: string;
};

/** Katalog + duplicate isim → (KOD) — hatali-soru-havuzu / recete-yaz parity */
export function loadStudentRows(): StudentRow[] {
  const list = loadStudentsFull({ seedIfEmpty: false });
  const nameCounts: Record<string, number> = {};
  for (const s of list) {
    const n = String(s.name || "").trim();
    if (n) nameCounts[n] = (nameCounts[n] || 0) + 1;
  }

  const rows: StudentRow[] = [];
  for (const s of list) {
    const name = String(s.name || "").trim();
    const code = String(s.studentCode || s.ogrenciId || "").trim();
    if (!name) continue;
    const dup = (nameCounts[name] || 0) > 1;
    const canonical = code
      ? `${name} (${code})`
      : dup
        ? `${name} · ${s.ogrenciId}`
        : name;
    const label = code ? `${name} (${code})` : canonical;
    const needle = `${name} ${code} ${s.ogrenciId} ${canonical}`.toLowerCase();
    rows.push({
      canonical,
      label,
      needle,
      ogrenciId: s.ogrenciId,
      studentCode: code || s.ogrenciId,
    });
  }
  rows.sort((a, b) => a.label.localeCompare(b.label, "tr"));
  return rows;
}

export function studentSelectOptions(): { value: string; label: string }[] {
  return [{ value: "", label: "Tüm öğrenciler" }, ...loadStudentRows().map((r) => ({
    value: r.canonical,
    label: r.label,
  }))];
}
