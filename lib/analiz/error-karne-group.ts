import type { QuestionResultCell } from "@/lib/analiz/error-karne";

export type ErrorSubjectGroup = {
  subjectName: string;
  cells: QuestionResultCell[];
  wrong: number;
  empty: number;
  correct: number;
  errorCount: number;
  minClassRate: number;
};

export function groupErrorsBySubject(cells: QuestionResultCell[]): ErrorSubjectGroup[] {
  const map = new Map<string, QuestionResultCell[]>();
  cells.forEach((c) => {
    const list = map.get(c.subjectName) || [];
    list.push(c);
    map.set(c.subjectName, list);
  });

  return Array.from(map.entries())
    .map(([subjectName, subjectCells]) => {
      const sorted = [...subjectCells].sort((a, b) => a.qNo - b.qNo);
      const wrong = sorted.filter((c) => c.result === "wrong").length;
      const empty = sorted.filter((c) => c.result === "empty").length;
      const correct = sorted.filter((c) => c.result === "correct").length;
      const minClassRate = sorted.length
        ? Math.min(...sorted.map((c) => c.classRate))
        : 0;
      return {
        subjectName,
        cells: sorted,
        wrong,
        empty,
        correct,
        errorCount: wrong + empty,
        minClassRate,
      };
    })
    .sort((a, b) => {
      if (b.errorCount !== a.errorCount) return b.errorCount - a.errorCount;
      return a.minClassRate - b.minClassRate;
    });
}

export function filterCellsBySubject(
  cells: QuestionResultCell[],
  subjectId: string
): QuestionResultCell[] {
  if (subjectId === "all") return cells;
  return cells.filter((c) => c.subjectName === subjectId);
}

export function filterCellsByResult(
  cells: QuestionResultCell[],
  mode: "all" | "wrong" | "empty" | "correct"
): QuestionResultCell[] {
  if (mode === "wrong") return cells.filter((c) => c.result === "wrong");
  if (mode === "empty") return cells.filter((c) => c.result === "empty");
  if (mode === "correct") return cells.filter((c) => c.result === "correct");
  return cells.filter((c) => c.result !== "correct");
}
