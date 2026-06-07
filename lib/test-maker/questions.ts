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
