import { getConcepts, getDersById, getTopicById } from "@/lib/mufredat";
import { decodeKonuCell } from "@/lib/exams/konu-cell";
import type { MatrixState } from "@/hooks/use-exam-matrix";

export type TargetBooklet = "B" | "C" | "D";

export const TARGET_BOOKLETS: TargetBooklet[] = ["B", "C", "D"];

/** Hedef kitapçık soru sırası (1..n) → Master (A) soru numarası */
export type BookletCrossMaps = Partial<Record<TargetBooklet, number[]>>;

export type DecodedKonuRow = {
  subjectId: string;
  topicId: string;
  conceptId: string;
};

function padMap(arr: number[] | undefined, n: number): number[] {
  const out = [...(arr || [])];
  while (out.length < n) out.push(0);
  return out.slice(0, n).map((v) => {
    const x = Math.floor(Number(v) || 0);
    return x > 0 ? x : 0;
  });
}

export function createEmptyBookletMaps(n: number): Record<TargetBooklet, number[]> {
  return {
    B: Array(n).fill(0),
    C: Array(n).fill(0),
    D: Array(n).fill(0),
  };
}

export function normalizeBookletMaps(
  raw: BookletCrossMaps | undefined,
  n: number
): Record<TargetBooklet, number[]> {
  return {
    B: padMap(raw?.B, n),
    C: padMap(raw?.C, n),
    D: padMap(raw?.D, n),
  };
}

export function countFilledMappings(map: number[]): number {
  return map.filter((v) => v > 0).length;
}

export function resolveMasterQuestionLabel(
  masterQ: number,
  matrix: MatrixState,
  getRowDecoded: (qi: number) => DecodedKonuRow
): string {
  if (masterQ < 1 || masterQ > matrix.n) return "";
  const qi = masterQ - 1;
  const yazi = String(matrix.konuYazi[qi] || "").trim();
  if (yazi) return yazi;

  const decoded = getRowDecoded(qi);
  const sid = decoded.subjectId || "";
  const topicName = decoded.topicId
    ? getTopicById(sid, decoded.topicId)?.name || ""
    : "";
  const conceptName =
    decoded.conceptId && decoded.topicId
      ? getConcepts(sid, decoded.topicId).find((c) => c.id === decoded.conceptId)?.name ||
        ""
      : "";
  if (topicName && conceptName) return `${topicName} · ${conceptName}`;
  if (topicName) return topicName;
  if (conceptName) return conceptName;

  const cell = matrix.konu[qi] || "";
  if (cell && !cell.startsWith("__")) {
    const d = decodeKonuCell(cell);
    const ders = d.subjectId ? getDersById(d.subjectId)?.dersAdi : "";
    if (ders) return ders;
  }
  return "";
}

export function clampMasterRef(value: string, maxQ: number): number {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return 0;
  const n = parseInt(digits, 10);
  if (Number.isNaN(n) || n < 1) return 0;
  return Math.min(n, maxQ);
}

export function validateBookletMaps(
  maps: Record<TargetBooklet, number[]>,
  questionCount: number
): { valid: boolean; filled: number; errors: string[] } {
  const errors: string[] = [];
  let filled = 0;
  for (const booklet of TARGET_BOOKLETS) {
    const row = maps[booklet] || [];
    row.forEach((masterQ, i) => {
      if (!masterQ) return;
      filled++;
      if (masterQ < 1 || masterQ > questionCount) {
        errors.push(
          `${booklet} kitapçığı soru ${i + 1}: A kitapçığında ${masterQ} geçersiz (1–${questionCount})`
        );
      }
    });
  }
  return { valid: errors.length === 0, filled, errors };
}

/** Dağıtım için sadece dolu eşlemeleri içeren kayıt */
export function serializeBookletMaps(
  maps: Record<TargetBooklet, number[]>
): BookletCrossMaps {
  const out: BookletCrossMaps = {};
  for (const b of TARGET_BOOKLETS) {
    const row = maps[b] || [];
    if (row.some((v) => v > 0)) out[b] = [...row];
  }
  return out;
}
