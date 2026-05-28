import { DEFAULT_COACH_ID, createOgrenciId, createStudentCode } from "@/lib/students/constants";
import type { StudentRecord, StudyField } from "@/lib/students/types";

function mapAlan(raw: string): StudyField {
  const s = raw.toLowerCase();
  if (s.includes("tyt")) return "tyt";
  if (s.includes("eşit") || s.includes("esit") || s.includes("ea")) return "esit";
  if (s.includes("sözel") || s.includes("sozel")) return "sozel";
  if (s.includes("dil")) return "dil";
  return "sayisal";
}

export function parseStudentsCsv(text: string): StudentRecord[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(/[,;\t]/).map((h) => h.trim().toLowerCase());
  const idx = (names: string[]) =>
    headers.findIndex((h) => names.some((n) => h.includes(n)));

  const iName = idx(["ad", "name", "öğrenci"]);
  const iGoal = idx(["hedef", "goal", "üniversite"]);
  const iParent = idx(["veli", "parent"]);
  const iPhone = idx(["telefon", "phone", "veli tel"]);
  const iAlan = idx(["alan", "field"]);
  const iSinif = idx(["sınıf", "sinif", "class"]);

  const out: StudentRecord[] = [];
  for (let r = 1; r < lines.length; r++) {
    const cols = lines[r].split(/[,;\t]/).map((c) => c.trim().replace(/^"|"$/g, ""));
    const name = cols[iName >= 0 ? iName : 0];
    if (!name) continue;
    out.push({
      ogrenciId: createOgrenciId(),
      coachId: DEFAULT_COACH_ID,
      name,
      studentCode: createStudentCode(),
      sinifBranch: iSinif >= 0 ? cols[iSinif] : "12",
      alan: iAlan >= 0 ? mapAlan(cols[iAlan]) : "sayisal",
      goal: iGoal >= 0 ? cols[iGoal] : "",
      targetUniversity: "",
      targetDepartment: "",
      kayitDate: new Date().toISOString().slice(0, 10),
      status: "aktif",
      parent: iParent >= 0 ? cols[iParent] : "—",
      parentPhone: iPhone >= 0 ? cols[iPhone] : "—",
    });
  }
  return out;
}

export function exportStudentsTsv(list: StudentRecord[]) {
  const header =
    "Ad Soyad\tHedef\tVeli\tVeli Tel\tAlan\tSınıf\tDurum\tKayıt\tÖğrenci No\n";
  const rows = list
    .map(
      (s) =>
        `${s.name}\t${s.goal}\t${s.parent}\t${s.parentPhone}\t${s.alan}\t${s.sinifBranch}\t${s.status}\t${s.kayitDate}\t${s.studentCode}`
    )
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/tab-separated-values;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ogrenciler-${new Date().toISOString().slice(0, 10)}.tsv`;
  a.click();
  URL.revokeObjectURL(url);
}
