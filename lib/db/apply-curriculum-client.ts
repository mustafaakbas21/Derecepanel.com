"use client";

import { getProgress, setNote, setStatus } from "@/lib/konu-takip/storage";
import type { SaveQuestionToCurriculumResult } from "@/lib/db/types";

export type ClientCurriculumMarkResult = {
  applied: boolean;
  skippedBecauseCompleted?: boolean;
  subjectName?: string;
  topicName?: string;
};

/** Sunucu kaydı sonrası Konu Takip Merkezi (localStorage) güncellemesi */
export function applyCurriculumMarkClient(
  studentId: string,
  result: SaveQuestionToCurriculumResult
): ClientCurriculumMarkResult {
  const { curriculum } = result;
  if (
    !curriculum.applied ||
    !curriculum.subjectId ||
    !curriculum.topicId
  ) {
    return { applied: false };
  }

  const progress = getProgress(
    studentId,
    curriculum.subjectId,
    curriculum.topicId
  );

  if (progress.status === "bitti") {
    return {
      applied: false,
      skippedBecauseCompleted: true,
      subjectName: curriculum.subjectName,
      topicName: curriculum.topicName,
    };
  }

  setStatus(studentId, curriculum.subjectId, curriculum.topicId, "calisiliyor");
  setNote(
    studentId,
    curriculum.subjectId,
    curriculum.topicId,
    `[Onyx] Tekrar edilmesi gerekli — ${new Date().toLocaleDateString("tr-TR")} · ${result.solve.hataKodu}`
  );

  return {
    applied: true,
    subjectName: curriculum.subjectName,
    topicName: curriculum.topicName,
  };
}
