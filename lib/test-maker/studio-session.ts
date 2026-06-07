import type { TMConfig, TMQuestion } from "@/lib/test-maker/types";

export type StudioSnapshot = {
  questions: TMQuestion[];
  config: Pick<TMConfig, "dersId" | "konuId" | "kurum" | "coverTitle" | "ogrenciId">;
  pdfFileCount: number;
  matrixKey: string | null;
};

export function buildStudioSnapshot(input: StudioSnapshot): string {
  return JSON.stringify({
    q: input.questions.map((q) => ({
      id: q.id,
      answer: q.answer ?? "",
      img: q.imageDataUrl.slice(0, 48),
    })),
    config: input.config,
    pdfFileCount: input.pdfFileCount,
    matrixKey: input.matrixKey,
  });
}
