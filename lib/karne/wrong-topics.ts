import { decodeKonuCell } from "@/lib/exams/konu-cell";
import { buildKeyStringFromExam, buildStudentAnswers } from "@/lib/exams/exam-evaluate";
import { getExamLayout } from "@/lib/exams/exam-layout";
import {
  repairUtf8Mojibake,
  resolveKonuKavramFromCell,
} from "@/lib/exams/matrix-resolve";
import { getDersById, getTopicOptions } from "@/lib/mufredat";
import type { ExamResultRow, MergedExam } from "@/lib/exams/types";

export type WrongTopic = { label: string; count: number };

export function buildWrongTopicsFromMatrix(
  rec: ExamResultRow,
  exam: MergedExam,
  topN = 5
): WrongTopic[] {
  const layout = getExamLayout(exam.sinav);
  const keyStr = buildKeyStringFromExam(exam, layout.n);
  const ans = buildStudentAnswers(rec, layout.n);
  const counts: Record<string, number> = {};

  for (let i = 0; i < layout.n; i++) {
    const k = keyStr.charAt(i);
    const a = ans.charAt(i);
    if (!k || k === " ") continue;
    if (!a || a === " ") {
      bump(i, "Boş");
      continue;
    }
    if (a !== k) bump(i, "Yanlış");
  }

  function bump(qi: number, kind: string) {
    const yazi = exam.konuYazi?.[qi] || "";
    const cell = exam.konu?.[qi] || "";
    const layoutCell = layout.byIndex[qi];
    const sid = layoutCell?.subjectId || decodeKonuCell(cell).subjectId;
    const pk = resolveKonuKavramFromCell(cell, sid, yazi);
    let label = pk.konu
      ? pk.kavram
        ? `${pk.konu} · ${pk.kavram}`
        : pk.konu
      : "";
    if (!label && cell) {
      const d = decodeKonuCell(cell);
      const ders = getDersById(d.subjectId);
      const topics = getTopicOptions(d.subjectId);
      const tLabel = topics.find((t) => t.id === d.topicId)?.label;
      label = tLabel ? `${ders?.dersAdi || ""} — ${tLabel}` : d.subjectId;
    }
    label = repairUtf8Mojibake(label);
    if (!label) label = `Soru ${qi + 1}`;
    const key = `${label} (${kind})`;
    counts[key] = (counts[key] || 0) + 1;
  }

  return Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

function escapeHtml(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Eski bds-karne konu tablosu HTML */
export function buildWrongTopicsHtml(rec: ExamResultRow, exam: MergedExam): string {
  const topics = buildWrongTopicsFromMatrix(rec, exam, 12).filter((t) =>
    t.label.includes("Yanlış")
  );
  if (!topics.length) {
    return '<p class="bds-karne-matrix-empty">Konu etiketli yanlış bulunamadı veya yanlış yok.</p>';
  }
  const rows = topics
    .map(
      (t) =>
        `<tr><td>${escapeHtml(t.label.replace(/\s*\(Yanlış\)\s*$/, ""))}</td><td class="bds-karne-mono text-center font-bold text-rose-700">${t.count}</td></tr>`
    )
    .join("");
  return `<table class="bds-karne-table bds-karne-table--topics w-full text-[12px]"><thead><tr><th>Konu</th><th class="text-center">Yanlış sayısı</th></tr></thead><tbody>${rows}</tbody></table>`;
}
