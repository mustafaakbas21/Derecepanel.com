import {
  buildKeyStringFromExam,
  buildStudentAnswers,
  countDyn,
  formatDynHyphen,
  sectionNetVal,
} from "@/lib/exams/exam-evaluate";
import { getExamLayout } from "@/lib/exams/exam-layout";
import type { ExamLayout, ExamResultRow, MergedExam, RankMeta } from "@/lib/exams/types";

export function studentRowKey(r: ExamResultRow): string {
  return String(r.studentId || r.studentCode || r.name || "");
}

export function subeLabel(r: ExamResultRow): string {
  return String(r.sube || "Genel").trim() || "Genel";
}

import { sortByScoreDesc } from "@/lib/scoring/rankings";

export function computeRankMeta(
  rows: ExamResultRow[]
): RankMeta {
  const sorted = sortByScoreDesc(rows);
  const genel: Record<string, number> = {};
  sorted.forEach((r, i) => {
    genel[studentRowKey(r)] = i + 1;
  });
  const sinif: Record<string, number> = {};
  const bySube: Record<string, ExamResultRow[]> = {};
  sorted.forEach((r) => {
    const sb = subeLabel(r);
    if (!bySube[sb]) bySube[sb] = [];
    bySube[sb].push(r);
  });
  Object.values(bySube).forEach((grp) => {
    sortByScoreDesc(grp).forEach((r, k) => {
      sinif[studentRowKey(r)] = k + 1;
    });
  });
  return { genel, sinif, total: sorted.length };
}

export function computeSectionKurumAvgs(
  rows: ExamResultRow[],
  exam: MergedExam,
  layout: ExamLayout,
  keyStr: string
): Record<string, number> {
  const sections = layout.sections || [];
  const sums: Record<string, { sum: number; c: number }> = {};
  const n = layout.n;
  rows.forEach((r) => {
    const ans = buildStudentAnswers(r, n);
    sections.forEach((sec) => {
      const t = countDyn(ans, keyStr, sec.startQ - 1, sec.endQ);
      const nt = sectionNetVal(t);
      const k = sec.title;
      if (!sums[k]) sums[k] = { sum: 0, c: 0 };
      sums[k].sum += nt;
      sums[k].c += 1;
    });
  });
  const avgs: Record<string, number> = {};
  Object.keys(sums).forEach((k) => {
    avgs[k] = sums[k].c ? Math.round((sums[k].sum / sums[k].c) * 100) / 100 : 0;
  });
  return avgs;
}

export interface RankedRow extends ExamResultRow {
  genelSira: number;
  subeSira: number;
  turkce?: string;
  mat?: string;
  fen?: string;
  sosyal?: string;
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
  pred: (cell: { subjectId: string }, i: number) => boolean
): number[] {
  const ix: number[] = [];
  for (let i = 0; i < byIndex.length; i++) {
    if (pred(byIndex[i], i)) ix.push(i);
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

export function buildRankedRows(
  rows: ExamResultRow[],
  exam: MergedExam,
  meta: RankMeta
): RankedRow[] {
  const layout = getExamLayout(exam.sinav);
  const keyStr = buildKeyStringFromExam(exam, layout.n);
  const sinav = exam.sinav;
  const ixTurk = indicesForPred(layout.byIndex, (c, i) => turkcePredicate(sinav, c));
  const ixMat = indicesForPred(layout.byIndex, (c, i) => matPredicate(sinav, c));
  const ixSos = indicesForPred(layout.byIndex, (c, i) => sosyalPredicate(sinav, c));
  const ixFen = indicesForPred(layout.byIndex, (c, i) => fenPredicate(sinav, c));

  return sortByScoreDesc(rows).map((r) => {
    const ans = buildStudentAnswers(r, layout.n);
    const key = studentRowKey(r);
    return {
      ...r,
      genelSira: meta.genel[key] ?? 0,
      subeSira: meta.sinif[key] ?? 0,
      turkce: formatDynHyphen(dynFromIndices(ans, keyStr, ixTurk)),
      mat: formatDynHyphen(dynFromIndices(ans, keyStr, ixMat)),
      fen: formatDynHyphen(dynFromIndices(ans, keyStr, ixFen)),
      sosyal: formatDynHyphen(dynFromIndices(ans, keyStr, ixSos)),
    };
  });
}

export function loTrSearch(s: string): string {
  return String(s || "")
    .toLocaleLowerCase("tr-TR")
    .replace(/\s+/g, " ")
    .trim();
}

export function examSearchHaystack(
  e: MergedExam,
  namesFromResults: Record<string, Record<string, boolean>>
): string {
  const parts = [
    e.name,
    e.ad,
    e.sinav,
    e.id,
    e.date,
    e.tarih,
    e.isGlobal ? "global" : "kurumsal",
  ];
  const id = e?.id != null ? String(e.id) : "";
  if (id && namesFromResults[id]) {
    Object.keys(namesFromResults[id]).forEach((k) => parts.push(k));
  }
  return loTrSearch(parts.filter(Boolean).join(" "));
}

export function buildExamNamesFromResultsIndex(
  results: ExamResultRow[]
): Record<string, Record<string, boolean>> {
  const idx: Record<string, Record<string, boolean>> = {};
  results.forEach((r) => {
    if (!r?.examId) return;
    const id = String(r.examId);
    const nm = String(r.examName || "").trim();
    if (!nm) return;
    if (!idx[id]) idx[id] = {};
    idx[id][nm] = true;
  });
  return idx;
}
