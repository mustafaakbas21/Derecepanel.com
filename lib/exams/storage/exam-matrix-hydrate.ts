import { getMatrix } from "@/lib/exams/exam-matrix";
import { getExamLayout, getExamQuestionCount } from "@/lib/exams/exam-layout";
import { encodeKonuCell } from "@/lib/exams/konu-cell";
import type { KurumDeneme } from "@/lib/exams/types";

function padArr(arr: string[] | undefined, len: number, fill = ""): string[] {
  const out = [...(arr || [])];
  while (out.length < len) out.push(fill);
  return out.slice(0, len);
}

function matrixTopicFilled(exam: Pick<KurumDeneme, "konu" | "konuYazi">): boolean {
  return (
    (exam.konu || []).some((k) => String(k).trim()) ||
    (exam.konuYazi || []).some((k) => String(k).trim())
  );
}

/** Takvim kaydında konu[] boşsa derece_exam_matrix_v1 kaydından doldur */
export function hydrateExamMatrixForEdit(exam: KurumDeneme): KurumDeneme {
  if (matrixTopicFilled(exam)) return exam;

  const stored = getMatrix(exam.id);
  if (!stored?.questions?.length) return exam;

  const n = exam.soruSayisi || getExamQuestionCount(exam.sinav);
  const layout = getExamLayout(exam.sinav);
  const konu = padArr(exam.konu, n);
  const konuYazi = padArr(exam.konuYazi, n);

  stored.questions.forEach((q) => {
    const qi = Number(q.qNo) - 1;
    if (qi < 0 || qi >= n) return;
    const sid = String(q.subjectId || layout.byIndex[qi]?.subjectId || "").trim();
    const tid = q.topicId ? String(q.topicId) : "";
    if (!sid && !tid && !q.topicName) return;
    konu[qi] = encodeKonuCell({ subjectId: sid, topicId: tid || undefined });
    konuYazi[qi] = String(q.topicName || "").trim();
  });

  if (!matrixTopicFilled({ konu, konuYazi })) return exam;
  return { ...exam, konu, konuYazi };
}

export function mergeMatrixArrays(
  next: string[] | undefined,
  prev: string[] | undefined,
  n: number,
  emptyFill = ""
): string[] {
  const paddedNext = padArr(next, n, emptyFill);
  const nextHas = paddedNext.some((v) => String(v).trim());
  if (nextHas) return paddedNext;
  const prevHas = (prev || []).some((v) => String(v).trim());
  if (prevHas) return padArr(prev, n, emptyFill);
  return paddedNext;
}
