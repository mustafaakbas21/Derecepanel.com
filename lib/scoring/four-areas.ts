import {
  buildKeyStringFromExam,
  buildStudentAnswers,
  formatDynHyphen,
} from "@/lib/exams/exam-evaluate";
import {
  calculateTYTScoreFromFourAreasStrings,
  fmtFixed,
  roundTo,
} from "@/lib/scoring/score-calculator";
import { getExamLayout } from "@/lib/exams/exam-layout";
import type { ExamLayout, ExamResultRow, MergedExam } from "@/lib/exams/types";

export interface FourAreas {
  turk: string;
  mat: string;
  sosyal: string;
  fen: string;
  note: boolean;
}

function turkcePredicate(sinav: string, cell: { subjectId: string }) {
  if (sinav === "AYT") return /^(ayt-edeb|ayt-tar1|ayt-cog1)/.test(cell.subjectId || "");
  if (sinav === "YDT") return true;
  return cell.subjectId === "tyt-tr";
}

function matPredicate(sinav: string, cell: { subjectId: string }) {
  if (sinav === "AYT") return cell.subjectId === "ayt-mat" || cell.subjectId === "ayt-geo";
  if (sinav === "YDT") return false;
  return cell.subjectId === "tyt-mat" || cell.subjectId === "tyt-geo";
}

function sosyalPredicate(sinav: string, cell: { subjectId: string }) {
  const id = cell.subjectId || "";
  if (sinav === "AYT") return /^(ayt-tar2|ayt-cog2|ayt-fel-grup|ayt-din)/.test(id);
  if (sinav === "YDT") return false;
  return /tyt-(tar|cog|fel|din)/.test(id);
}

function fenPredicate(sinav: string, cell: { subjectId: string }) {
  const id = cell.subjectId || "";
  if (sinav === "AYT") return /^(ayt-fiz|ayt-kim|ayt-biyo)/.test(id);
  if (sinav === "YDT") return false;
  return /tyt-(fiz|kim|biyo)/.test(id);
}

function indicesForPred(
  byIndex: { subjectId: string }[],
  pred: (cell: { subjectId: string }) => boolean
): number[] {
  const ix: number[] = [];
  for (let i = 0; i < byIndex.length; i++) {
    if (pred(byIndex[i])) ix.push(i);
  }
  return ix;
}

function dynFromIndices(ans: string, key: string, indices: number[]) {
  let d = 0;
  let y = 0;
  let n = 0;
  for (const i of indices) {
    const k = key.charAt(i);
    const a = ans.charAt(i);
    if (!k || k === " ") {
      n++;
      continue;
    }
    if (!a || a === " ") n++;
    else if (a === k) d++;
    else y++;
  }
  return { d, y, n };
}

export function rowFourAreas(
  rec: ExamResultRow,
  exam: MergedExam,
  layout: ExamLayout,
  keyStr: string
): FourAreas {
  const sinav = exam.sinav || "TYT";
  const n = layout.n;
  const key = keyStr;
  const hasKey = key.replace(/\s/g, "").length > 0;
  const ans = buildStudentAnswers(rec, n);
  const dash = "—";

  if (!hasKey) {
    const tot = {
      d: Number(rec.correct) || 0,
      y: Number(rec.wrong) || 0,
      n: Number(rec.blank) || 0,
    };
    return {
      turk: formatDynHyphen(tot),
      mat: dash,
      sosyal: dash,
      fen: dash,
      note: true,
    };
  }

  const by = layout.byIndex;
  if (sinav === "YDT") {
    const allIx = by.map((_, i) => i);
    const full = dynFromIndices(ans, key, allIx);
    return {
      turk: formatDynHyphen(full),
      mat: dash,
      sosyal: dash,
      fen: dash,
      note: false,
    };
  }

  const predWrap =
    (fn: (s: string, c: { subjectId: string }) => boolean) =>
    (cell: { subjectId: string }) =>
      fn(sinav, cell);

  const trD = dynFromIndices(
    ans,
    key,
    indicesForPred(by, predWrap(turkcePredicate))
  );
  const mD = dynFromIndices(ans, key, indicesForPred(by, predWrap(matPredicate)));
  const sD = dynFromIndices(ans, key, indicesForPred(by, predWrap(sosyalPredicate)));
  const fD = dynFromIndices(ans, key, indicesForPred(by, predWrap(fenPredicate)));

  return {
    turk: formatDynHyphen(trD),
    mat: formatDynHyphen(mD),
    sosyal: formatDynHyphen(sD),
    fen: formatDynHyphen(fD),
    note: false,
  };
}

export function prepareExamRowsWithPuan(
  rows: ExamResultRow[],
  exam: MergedExam
): ExamResultRow[] {
  const layout = getExamLayout(exam.sinav);
  const keyStr = buildKeyStringFromExam(exam, layout.n);
  return rows.map((r) => {
    const copy = { ...r };
    computeAndAttachPuan(copy, exam, layout, keyStr);
    return copy;
  });
}

export function computeAndAttachPuan(
  rec: ExamResultRow,
  exam: MergedExam,
  layout: ExamLayout,
  keyStr: string
): number | null {
  if (exam.sinav !== "TYT") return null;
  const four = rowFourAreas(rec, exam, layout, keyStr);
  if (four.note) return null;
  const puan = calculateTYTScoreFromFourAreasStrings(four);
  const fixed = roundTo(puan, 3);
  rec.puan = fmtFixed(fixed, 3);
  return fixed;
}
