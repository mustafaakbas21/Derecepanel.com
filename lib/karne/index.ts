import { downloadPdfFromHtmlDocument } from "@/lib/html-export/iframe-html2pdf";
import { buildKarneHtml } from "@/lib/karne/build-student-karne";
import {
  buildRankedReportFragment,
  buildRankedReportHTML,
} from "@/lib/karne/build-ranked-report";
import type { ExamResultRow, MergedExam } from "@/lib/exams/types";

export {
  buildKarneHtml,
  buildSelectedStudentKarnesFragment,
  buildSelectedStudentKarnesHTML,
  buildSelectedStudentKarnesHTMLByIds,
  buildSingleStudentKarnePage,
  karneDocumentShell,
  resolveExamTitle,
} from "@/lib/karne/build-student-karne";
export {
  buildRankedReportFragment,
  buildRankedReportHTML,
} from "@/lib/karne/build-ranked-report";
export { buildWrongTopicsFromMatrix, buildWrongTopicsHtml } from "@/lib/karne/wrong-topics";

export async function downloadKarnePdf(
  examId: string,
  studentId: string,
  fileName?: string
) {
  const html = buildKarneHtml(examId, studentId);
  await downloadPdfFromHtmlDocument(html, {
    filename: fileName || `karne-${studentId}.pdf`,
    margin: 8,
  });
}

export function openKarnePrint(examId: string, studentId: string) {
  const html = buildKarneHtml(examId, studentId);
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
}

/** Eski: yeni pencere — modal tercih edilir */
export function openRankedReportPrint(exam: MergedExam, rows: ExamResultRow[]) {
  const html = buildRankedReportHTML(exam, rows);
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
}
