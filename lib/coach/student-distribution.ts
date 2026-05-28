import { normalizeStudyField } from "@/lib/students/normalize-field";
import type { StudentRecord, StudyField } from "@/lib/students/types";

/** Dashboard donut — AYT alanları (+ varsa TYT) */
export const DISTRIBUTION_FIELDS: StudyField[] = [
  "sayisal",
  "esit",
  "sozel",
  "dil",
  "tyt",
];

/** Türkçe yazım: cümle içi alan adları */
export const DISTRIBUTION_LABELS: Record<StudyField, string> = {
  sayisal: "Sayısal",
  esit: "Eşit ağırlık",
  sozel: "Sözel",
  dil: "Dil",
  tyt: "TYT",
};

/** Akademik palet — sayfa tasarımıyla uyumlu */
export const DISTRIBUTION_COLORS: Record<StudyField, string> = {
  sayisal: "#2563eb",
  esit: "#6366f1",
  sozel: "#d97706",
  dil: "#0d9488",
  tyt: "#64748b",
};

export interface DistributionSlice {
  field: StudyField;
  label: string;
  count: number;
  percent: number;
  color: string;
}

/** Öğrencilerim `alanCounts` ile aynı havuz: listedeki tüm kayıtlar */
export function studentsForDistribution(students: StudentRecord[]) {
  return students;
}

function distributePercents(counts: number[], total: number): number[] {
  if (total <= 0) return counts.map(() => 0);
  const raw = counts.map((c) => (c / total) * 100);
  const floors = raw.map((r) => Math.floor(r));
  let remainder = 100 - floors.reduce((a, b) => a + b, 0);
  const order = raw
    .map((r, i) => ({ i, frac: r - floors[i]! }))
    .sort((a, b) => b.frac - a.frac);
  const percents = [...floors];
  for (let k = 0; k < remainder; k++) {
    const idx = order[k % order.length]?.i ?? 0;
    percents[idx]! += 1;
  }
  return percents;
}

export function computeStudentDistribution(
  students: StudentRecord[]
): DistributionSlice[] {
  const base = studentsForDistribution(students);
  const total = base.length;

  const emptySlices = () =>
    DISTRIBUTION_FIELDS.filter((f) => f !== "tyt").map((field) => ({
      field,
      label: DISTRIBUTION_LABELS[field],
      count: 0,
      percent: 0,
      color: DISTRIBUTION_COLORS[field],
    }));

  if (total === 0) return emptySlices();

  const counts: Record<StudyField, number> = {
    sayisal: 0,
    esit: 0,
    sozel: 0,
    dil: 0,
    tyt: 0,
  };

  for (const s of base) {
    const alan = normalizeStudyField(s.alan);
    counts[alan] += 1;
  }

  const fields = DISTRIBUTION_FIELDS.filter((f) => f !== "tyt" || counts.tyt > 0);
  const countList = fields.map((f) => counts[f]);
  const percents = distributePercents(countList, total);

  return fields.map((field, i) => ({
    field,
    label: DISTRIBUTION_LABELS[field],
    count: counts[field],
    percent: percents[i] ?? 0,
    color: DISTRIBUTION_COLORS[field],
  }));
}
