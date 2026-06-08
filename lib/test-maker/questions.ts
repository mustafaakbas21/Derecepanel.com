import type {
  CropAnswerChoice,
  QuestionAnswer,
  TMQuestion,
} from "@/lib/test-maker/types";

export function createQuestion(
  opts?: Partial<TMQuestion> & {
    imageDataUrl?: string;
    correctLetter?: CropAnswerChoice;
  }
): TMQuestion {
  return {
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    imageDataUrl: opts?.imageDataUrl ?? "",
    answer: opts?.correctLetter ?? opts?.answer ?? null,
    fromHavuz: opts?.fromHavuz,
    poolUuid: opts?.poolUuid,
  };
}

export function lastFilledQuestionIndex(questions: TMQuestion[]): number {
  for (let i = questions.length - 1; i >= 0; i -= 1) {
    if (questions[i]?.imageDataUrl) return i;
  }
  return -1;
}

export function adjustLastWorkedIndexAfterDelete(
  lastWorkedIndex: number,
  deletedIndex: number
): number {
  if (deletedIndex < 0) return lastWorkedIndex;
  if (deletedIndex < lastWorkedIndex) return lastWorkedIndex - 1;
  if (deletedIndex === lastWorkedIndex) return Math.max(-1, lastWorkedIndex - 1);
  return lastWorkedIndex;
}
