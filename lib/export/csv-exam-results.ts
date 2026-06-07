import { buildKeyStringFromExam } from "@/lib/exams/exam-evaluate";
import { getExamLayout } from "@/lib/exams/exam-layout";
import { findExamById } from "@/lib/exams/exam-storage";
import type { ExamResultRow } from "@/lib/exams/types";
import { prepareExamRowsWithPuan } from "@/lib/scoring/four-areas";
import { sortByScoreDesc } from "@/lib/scoring/rankings";

function csvEscape(cell: unknown): string {
  const t = String(cell ?? "");
  if (/[",\n\r]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
  return t;
}

function sanitizeFilenamePart(s: string): string {
  return (
    String(s || "sinav")
      .replace(/[^\w\u00C0-\u024f-]+/gi, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 80) || "sinav"
  );
}

export function exportExamToCsv(examId: string, rows: ExamResultRow[]): number {
  const exam = findExamById(examId);
  if (!exam) return 0;
  const layout = getExamLayout(exam.sinav);
  const keyStr = buildKeyStringFromExam(exam, layout.n);
  const prepared = sortByScoreDesc(prepareExamRowsWithPuan(rows, exam));
  const sep = ";";
  const headers = ["Sıra", "Öğrenci No", "Ad Soyad", "Net", "Puan"];
  const lines = [headers.join(sep)];
  prepared.forEach((r, idx) => {
    const net = r.net != null ? Number(r.net).toFixed(2) : "0.00";
    const puan = r.puan != null && r.puan !== "" ? String(r.puan) : "";
    lines.push(
      [
        csvEscape(idx + 1),
        csvEscape(r.studentCode || r.studentId),
        csvEscape(r.name || r.studentName),
        csvEscape(net),
        csvEscape(puan),
      ].join(sep)
    );
  });
  const bom = "\ufeff";
  const blob = new Blob([bom + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const base = sanitizeFilenamePart(exam.name || exam.ad || examId);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${base}_Sonuclari.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2500);
  return prepared.length;
}
