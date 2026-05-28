import type { QPerPage, TMQuestion } from "@/lib/test-maker/types";

export function computePagination(
  questions: TMQuestion[],
  qPerPage: QPerPage,
  manualExtraPages: number
) {
  const n = questions.length;
  const autoExtra = n === 0 ? 0 : Math.max(0, Math.ceil(n / qPerPage) - 1);
  const totalExtra = Math.max(autoExtra, manualExtraPages);

  const main = questions.slice(0, Math.min(qPerPage, n));
  const extras: TMQuestion[][] = [];

  for (let p = 0; p < totalExtra; p++) {
    const start = (p + 1) * qPerPage;
    const end = Math.min(start + qPerPage, n);
    extras.push(questions.slice(start, end));
  }

  return { main, extras, totalExtra };
}

export function flattenPagination(
  main: TMQuestion[],
  extras: TMQuestion[][]
): TMQuestion[] {
  return [...main, ...extras.flat()];
}

export function buildAnswerKey(questions: TMQuestion[]): string {
  return questions
    .map((q) => {
      const a = q.answer?.toUpperCase() ?? "";
      return /^[A-E]$/.test(a) ? a : " ";
    })
    .join("");
}

export function splitAnswerKeyColumns(questions: TMQuestion[]) {
  const n = questions.length;
  if (n === 0) return [[], [], []] as TMQuestion[][];
  const perCol = Math.ceil(n / 3);
  return [
    questions.slice(0, perCol),
    questions.slice(perCol, perCol * 2),
    questions.slice(perCol * 2),
  ];
}
