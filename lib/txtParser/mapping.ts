import type {
  ColumnHypothesis,
  ColumnMappingState,
  ColumnRole,
  MappedTxtRow,
  ParsedTxtFile,
} from "@/lib/txtParser/types";

const GLUED_ID_NAME_RE = /^(\d{3,11})([A-ZÇĞİÖŞÜa-zçğıöşü\s.'-]+)$/;

function normalizeCell(v: string): string {
  return String(v ?? "").trim();
}

function normalizeTestBlock(raw: string): string {
  return String(raw ?? "")
    .toUpperCase()
    .replace(/[^A-E\s]/g, "")
    .replace(/\s+/g, "");
}

export const COLUMN_ROLE_OPTIONS: { value: ColumnRole; label: string }[] = [
  { value: "unknown", label: "Bilinmiyor" },
  { value: "ignore", label: "Yoksay" },
  { value: "tc", label: "TC Kimlik (11 hane)" },
  { value: "student_no", label: "Öğrenci No" },
  { value: "student_id_name", label: "No + Ad (bitişik)" },
  { value: "name", label: "Ad Soyad" },
  { value: "class_branch", label: "Sınıf / Şube" },
  { value: "booklet", label: "Kitapçık (A–D)" },
  { value: "test_block", label: "Test / cevap bloğu" },
];

export function buildInitialMapping(parsed: ParsedTxtFile): ColumnMappingState {
  const byIndex: Record<number, ColumnRole> = {};
  parsed.columns.forEach((col) => {
    byIndex[col.index] = col.role;
  });
  return { byIndex };
}

export function updateColumnMapping(
  prev: ColumnMappingState,
  columnIndex: number,
  role: ColumnRole
): ColumnMappingState {
  return { byIndex: { ...prev.byIndex, [columnIndex]: role } };
}

export function getMappedRole(
  mapping: ColumnMappingState,
  columnIndex: number,
  fallback: ColumnHypothesis | undefined
): ColumnRole {
  return mapping.byIndex[columnIndex] ?? fallback?.role ?? "unknown";
}

export function canSimulateMapping(mapping: ColumnMappingState): boolean {
  const roles = Object.values(mapping.byIndex);
  const hasIdentity =
    roles.includes("tc") || roles.includes("student_no") || roles.includes("student_id_name");
  const hasName = roles.includes("name") || roles.includes("student_id_name");
  const hasTest = roles.includes("test_block");
  return hasIdentity && hasName && hasTest;
}

export function applyColumnMapping(
  parsed: ParsedTxtFile,
  mapping: ColumnMappingState
): MappedTxtRow[] {
  return parsed.rows.map((cells) => {
    let tc = "";
    let studentNo = "";
    let name = "";
    let booklet = "";
    let classBranch = "";
    const answerParts: string[] = [];

    parsed.columns.forEach((col, idx) => {
      const role = getMappedRole(mapping, idx, col);
      const val = normalizeCell(cells[idx] ?? "");
      if (!val || role === "ignore" || role === "unknown") return;

      switch (role) {
        case "tc":
          tc = val;
          break;
        case "student_no":
          studentNo = val;
          break;
        case "student_id_name": {
          const m = val.match(GLUED_ID_NAME_RE);
          if (m) {
            studentNo = m[1];
            name = m[2].trim();
          } else if (/^\d+$/.test(val)) studentNo = val;
          else name = val;
          break;
        }
        case "name":
          name = val;
          break;
        case "class_branch":
          classBranch = val;
          break;
        case "booklet": {
          const v = val.trim();
          if (/^[A-Da-d]$/.test(v)) {
            booklet = v.charAt(0).toUpperCase();
          } else {
            const glued = v.match(/^([A-Da-d])([A-E]{8,})$/i);
            if (glued) {
              booklet = glued[1].toUpperCase();
              answerParts.push(normalizeTestBlock(glued[2]));
            } else {
              booklet = v.charAt(0).toUpperCase();
            }
          }
          break;
        }
        case "test_block":
          answerParts.push(normalizeTestBlock(val));
          break;
        default:
          break;
      }
    });

    const answers = answerParts.join("").replace(/[^A-E]/gi, "").toUpperCase();

    return {
      tc,
      studentNo,
      name: name.replace(/\s{2,}/g, " ").trim(),
      booklet,
      classBranch,
      answers,
      rawCells: cells,
    };
  });
}

export function hypothesisForColumn(
  parsed: ParsedTxtFile,
  index: number
): ColumnHypothesis | undefined {
  return parsed.columns.find((c) => c.index === index);
}
