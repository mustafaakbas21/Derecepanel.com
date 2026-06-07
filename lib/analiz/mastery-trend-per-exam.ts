import { computeStudentQuestionResults } from "@/lib/analiz/question-results";
import type { TopicStat } from "@/lib/analiz/mastery-trend-types";
import { getAnswerKeyForExamId } from "@/lib/analiz/hydrate";

function topicKeyFromParts(subjectName: string, topicName: string): string {
  return `${subjectName}|${topicName}`;
}

function roundPct(correct: number, total: number): number {
  if (!total) return 0;
  return Math.round((1000 * correct) / total) / 10;
}

function netFromDyb(dogru: number, yanlis: number): number {
  return Math.max(0, Math.round((dogru - yanlis / 4) * 100) / 100);
}

/** Tek deneme — öğrenci konu bazlı istatistik */
export function collectTopicStatsForExam(
  studentId: string,
  examId: string
): Map<string, TopicStat> {
  const sid = String(studentId || "").trim();
  const eid = String(examId || "").trim();
  const map = new Map<string, TopicStat>();
  if (!sid || !eid) return map;

  const keyStr = getAnswerKeyForExamId(eid);
  const cells = computeStudentQuestionResults(eid, sid, keyStr);

  for (const c of cells) {
    const dersAdi = c.subjectName || "—";
    const konuAdi = c.topicName || "Genel";
    const tk = topicKeyFromParts(dersAdi, konuAdi);
    const prev = map.get(tk);
    const dogru = (prev?.dogru ?? 0) + (c.result === "correct" ? 1 : 0);
    const yanlis = (prev?.yanlis ?? 0) + (c.result === "wrong" ? 1 : 0);
    const bos = (prev?.bos ?? 0) + (c.result === "empty" ? 1 : 0);
    const total = dogru + yanlis + bos;
    map.set(tk, {
      topicKey: tk,
      konuAdi,
      dersAdi,
      dogru,
      yanlis,
      bos,
      net: netFromDyb(dogru, yanlis),
      basariYuzdesi: roundPct(dogru, total),
    });
  }

  return map;
}
