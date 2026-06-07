import type { ColumnMappingState, ColumnRole, ParsedTxtFile } from "@/lib/txtParser/types";
import { applyColumnMapping, getMappedRole } from "@/lib/txtParser/mapping";
import {
  findStudentByCode,
  normalizeName,
} from "@/lib/exams/student-catalog-bridge";
import type { CatalogStudent } from "@/lib/exams/types";

const ROLE_LABELS: Record<ColumnRole, string> = {
  tc: "TC Kimlik",
  student_no: "Öğrenci No",
  student_id_name: "No + Ad",
  name: "Ad Soyad",
  class_branch: "Sınıf / Şube",
  booklet: "Kitapçık",
  test_block: "Cevap bloğu",
  unknown: "Bilinmiyor",
  ignore: "Yoksay",
};

export type MappingSummaryItem = {
  index: number;
  role: ColumnRole;
  label: string;
  count: number;
};

export function buildMappingSummary(
  parsed: ParsedTxtFile,
  mapping: ColumnMappingState
): MappingSummaryItem[] {
  const items: MappingSummaryItem[] = [];
  parsed.columns.forEach((col) => {
    const role = getMappedRole(mapping, col.index, col);
    if (role === "ignore" || role === "unknown") return;
    const existing = items.find((x) => x.role === role && x.index === col.index);
    if (existing) {
      existing.count += 1;
      return;
    }
    items.push({
      index: col.index,
      role,
      label: ROLE_LABELS[role] ?? role,
      count: 1,
    });
  });
  return items;
}

export function formatCellPreview(role: ColumnRole, value: string): string {
  const v = value.trim();
  if (!v) return "—";
  if (role === "test_block") {
    const len = v.replace(/\s/g, "").length;
    return `${len} cevap · ${v.slice(0, 12)}${len > 12 ? "…" : ""}`;
  }
  if (role === "booklet") {
    if (/^[A-Da-d]$/.test(v)) return `Kitapçık ${v.charAt(0).toUpperCase()}`;
    const glued = v.match(/^([A-Da-d])([A-E]{8,})$/i);
    if (glued) {
      return `Kitapçık ${glued[1].toUpperCase()} + ${glued[2].length} cevap`;
    }
    return `Kitapçık ${v.charAt(0).toUpperCase()}`;
  }
  if (role === "class_branch") return v;
  if (v.length > 28) return `${v.slice(0, 28)}…`;
  return v;
}

export type MappingStudentPreviewRow = {
  rowIndex: number;
  no: string;
  name: string;
  booklet: string;
  matched: boolean;
  catalogName?: string;
  matchBy: "code" | "name" | null;
};

/** Eşleme modalı — dosyadaki ad/no ile katalog karşılaştırması */
export function buildMappingStudentPreview(
  parsed: ParsedTxtFile,
  mapping: ColumnMappingState,
  students: CatalogStudent[]
): MappingStudentPreviewRow[] {
  const mapped = applyColumnMapping(parsed, mapping);
  return mapped
    .map((m, rowIndex) => {
      const no = (m.studentNo || m.tc).trim();
      const name = m.name.trim();
      let matched = false;
      let catalogName: string | undefined;
      let matchBy: "code" | "name" | null = null;

      const byCode = findStudentByCode(students, no);
      if (byCode) {
        matched = true;
        catalogName = byCode.name;
        matchBy = "code";
      } else if (name) {
        const key = normalizeName(name);
        const byName = students.find((s) => normalizeName(s.name) === key);
        if (byName) {
          matched = true;
          catalogName = byName.name;
          matchBy = "name";
        }
      }

      return {
        rowIndex,
        no,
        name,
        booklet: m.booklet,
        matched,
        catalogName,
        matchBy,
      };
    })
    .filter((r) => r.no || r.name);
}
