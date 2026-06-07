import { buildKeyStringFromExam } from "@/lib/exams/exam-evaluate";
import { getExamLayout } from "@/lib/exams/exam-layout";
import { getKurumAdi } from "@/lib/exams/institution";
import {
  computeRankMeta,
  studentRowKey,
} from "@/lib/exams/exam-rank";
import type { ExamResultRow, MergedExam } from "@/lib/exams/types";
import { karneDocumentShell } from "@/lib/karne/build-student-karne";
import { computeAndAttachPuan, prepareExamRowsWithPuan, rowFourAreas } from "@/lib/scoring/four-areas";
import { sortByScoreDesc } from "@/lib/scoring/rankings";

function escapeHtml(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatTrDate(d: string): string {
  if (!d || d.length < 10) return d || "—";
  const p = d.split("-");
  if (p.length < 3) return p.length ? d : "—";
  return `${p[2]}.${p[1]}.${p[0]}`;
}

function puanCell(rec: ExamResultRow): string {
  if (rec.puan != null && rec.puan !== "") return escapeHtml(String(rec.puan));
  return "—";
}

/** Eski basit-deneme-sonuclari — modal gövdesi (fragment) */
export function buildRankedReportFragment(
  exam: MergedExam,
  rows: ExamResultRow[],
  kurumAdi = getKurumAdi()
): string {
  const layout = getExamLayout(exam.sinav);
  const keyStr = buildKeyStringFromExam(exam, layout.n);
  const prepared = prepareExamRowsWithPuan(rows, exam);
  prepared.forEach((r) => computeAndAttachPuan(r, exam, layout, keyStr));
  const sorted = sortByScoreDesc(prepared);
  const rankMeta = computeRankMeta(sorted);
  const avgStr =
    sorted.length > 0
      ? (
          sorted.reduce((s, r) => s + (Number(r.net) || 0), 0) / sorted.length
        ).toFixed(2)
      : "—";

  const note = !keyStr.replace(/\s/g, "").length
    ? '<p class="bds-karne-note mt-3 rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-2.5 text-[11px] font-medium text-amber-950">Alan sütunları için sınavda <b>cevap anahtarı</b> tanımlı olmalıdır. Anahtar yokken Türkçe hücresi toplam doğru–yanlış–net (Net = D − Y/4) gösterilir.</p>'
    : "";

  const body = sorted.length
    ? sorted
        .map((r, idx) => {
          const four = rowFourAreas(r, exam, layout, keyStr);
          const name = escapeHtml(r.name || r.studentName || "—");
          const no = escapeHtml(String(r.studentCode || r.studentId || "—"));
          const net = r.net != null ? Number(r.net).toFixed(2) : "0.00";
          const keyk = studentRowKey(r);
          const kurS = rankMeta.genel[keyk] != null ? String(rankMeta.genel[keyk]) : "—";
          const subS = rankMeta.sinif[keyk] != null ? String(rankMeta.sinif[keyk]) : "—";
          const zebra = idx % 2 === 0 ? "bds-karne-table__row--a" : "bds-karne-table__row--b";
          return `<tr class="${zebra}"><td class="bds-karne-table__rank">${idx + 1}</td><td class="bds-karne-mono text-slate-800">${no}</td><td class="font-semibold text-slate-900">${name}</td><td class="bds-karne-mono text-center text-slate-700">${escapeHtml(four.turk)}</td><td class="bds-karne-mono text-center text-slate-700">${escapeHtml(four.mat)}</td><td class="bds-karne-mono text-center text-slate-700">${escapeHtml(four.sosyal)}</td><td class="bds-karne-mono text-center text-slate-700">${escapeHtml(four.fen)}</td><td class="text-center font-extrabold text-slate-900">${net}</td><td class="bds-karne-mono text-center text-slate-700">${puanCell(r)}</td><td class="text-center font-bold text-indigo-800">${escapeHtml(subS)}</td><td class="text-center font-bold text-slate-800">${escapeHtml(kurS)}</td></tr>`;
        })
        .join("")
    : '<tr><td colspan="11" class="py-12 text-center text-slate-500">Bu sınav için sonuç kaydı yok.</td></tr>';

  return `<div class="bds-print-block bds-karne-kurum mx-auto max-w-[100%]"><header class="bds-karne-kurum-premium mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-stretch sm:justify-between"><div class="flex min-w-0 flex-1 gap-4"><div class="bds-karne-logo-ph shrink-0" aria-hidden="true">LOGO</div><div class="min-w-0 text-left"><p class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">${escapeHtml(kurumAdi)}</p><h3 class="mt-1 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">${escapeHtml(exam.name || exam.ad || exam.id)}</h3><p class="mt-1 text-sm text-slate-600">Sınav tarihi: <strong>${formatTrDate(exam.tarih || exam.date || "")}</strong> · ${escapeHtml(exam.sinav)}</p></div></div><div class="bds-karne-kurum-stats shrink-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm shadow-sm"><div class="font-bold text-slate-900">Özet</div><div class="mt-2 space-y-1 text-slate-700"><div>Katılım: <strong>${sorted.length}</strong> kişi</div><div>Kurum ort. net: <strong>${escapeHtml(avgStr)}</strong></div></div></div></header>${note}<div class="bds-karne-tablewrap overflow-x-auto rounded-2xl border border-slate-200 shadow-sm"><table class="bds-karne-table bds-karne-table--kurum-premium w-full border-collapse text-[11px] sm:text-xs"><thead><tr><th>Sıra</th><th>Öğrenci no</th><th>Ad soyad</th><th class="text-center">Türkçe<br/><span class="bds-th-sub">(D-Y-Net)</span></th><th class="text-center">Matematik<br/><span class="bds-th-sub">(D-Y-Net)</span></th><th class="text-center">Sosyal<br/><span class="bds-th-sub">(D-Y-Net)</span></th><th class="text-center">Fen<br/><span class="bds-th-sub">(D-Y-Net)</span></th><th class="text-center">Toplam net</th><th class="text-center">Puan</th><th class="text-center">Şube sırası</th><th class="text-center">Kurum sırası</th></tr></thead><tbody>${body}</tbody></table></div></div>`;
}

export function buildRankedReportHTML(
  exam: MergedExam,
  rows: ExamResultRow[],
  kurumAdi = getKurumAdi()
): string {
  return karneDocumentShell(
    buildRankedReportFragment(exam, rows, kurumAdi),
    `Kurum sıralı liste — ${exam.name || exam.ad}`
  );
}
