import {
  buildKeyStringFromExam,
  buildStudentAnswers,
  countDyn,
  formatDynHyphen,
  sectionNetVal,
} from "@/lib/exams/exam-evaluate";
import { getExamLayout } from "@/lib/exams/exam-layout";
import { getResolvedExamMatrix } from "@/lib/exams/exam-matrix";
import { findExamById } from "@/lib/exams/exam-storage";
import {
  findExamResultRow,
  resultsForExamInPool,
} from "@/lib/sonuc-merkezi/results-pool";
import {
  computeRankMeta,
  computeSectionKurumAvgs,
  studentRowKey,
  subeLabel,
} from "@/lib/exams/exam-rank";
import type { ExamResultRow, MergedExam } from "@/lib/exams/types";
import { buildWrongTopicsHtml } from "@/lib/karne/wrong-topics";
import { getKurumAdi } from "@/lib/exams/institution";
import { decodeKonuCell } from "@/lib/exams/konu-cell";
import {
  repairUtf8Mojibake,
  resolveKonuKavramFromCell,
} from "@/lib/exams/matrix-resolve";
import { getDersById, getTopicOptions, getConcepts } from "@/lib/mufredat";

function escapeHtml(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatTrDate(d: string): string {
  if (!d || d.length < 10) return d || "—";
  const p = d.split("-");
  if (p.length < 3) return d;
  return `${p[2]}.${p[1]}.${p[0]}`;
}

function bdsSubjectLabel(sid: string): string {
  const d = getDersById(sid);
  return d?.dersAdi || sid || "—";
}

function bdsZorlukLabel(z: string): string {
  const m: Record<string, string> = { "0": "Kolay", "1": "Orta", "2": "Zor", "3": "Çok zor" };
  return m[String(z)] || "—";
}

function splitKonuKavram(label: string): { konu: string; kavram: string } {
  const t = label.trim();
  const sep = t.includes(" · ") ? t.indexOf(" · ") : t.indexOf(" — ");
  if (sep >= 0) {
    return { konu: t.slice(0, sep).trim(), kavram: t.slice(sep + 3).trim() };
  }
  return { konu: t, kavram: "" };
}

function konuLabel(exam: MergedExam, qi: number): string {
  const layout = getExamLayout(exam.sinav);
  const cell = exam.konu?.[qi] || "";
  const yazi = exam.konuYazi?.[qi] || "";
  const sid = layout.byIndex[qi]?.subjectId || decodeKonuCell(cell).subjectId;
  const pk = resolveKonuKavramFromCell(cell, sid, yazi);
  if (pk.konu) {
    return repairUtf8Mojibake(pk.kavram ? `${pk.konu} · ${pk.kavram}` : pk.konu);
  }
  if (!cell) return "—";
  const d = decodeKonuCell(cell);
  const ders = getDersById(d.subjectId);
  const topics = getTopicOptions(d.subjectId);
  const t = topics.find((x) => x.id === d.topicId);
  if (d.conceptId && d.topicId) {
    const c = getConcepts(d.subjectId, d.topicId).find((x) => x.id === d.conceptId);
    if (c) {
      return repairUtf8Mojibake(`${ders?.dersAdi || ""} — ${t?.label || ""} (${c.name})`);
    }
  }
  return repairUtf8Mojibake(
    t ? `${ders?.dersAdi || ""} — ${t.label}` : ders?.dersAdi || "—"
  );
}

function buildKarneMatrixWrongPage(
  exam: MergedExam,
  rec: ExamResultRow,
  layout: ReturnType<typeof getExamLayout>,
  keyStr: string,
  ans: string
): string {
  const n = layout.n || 120;
  const by = layout.byIndex || [];
  const zArr = exam.zorluk || [];
  const resolvedMx = getResolvedExamMatrix(exam.id);
  const mxByQ = new Map(
    (resolvedMx?.questions || []).map((q) => [q.qNo, q] as const)
  );
  const rows: {
    q: number | string;
    branch: string;
    konu: string;
    kavram: string;
    st: string;
    z: string;
  }[] = [];

  for (let i = 0; i < n; i++) {
    const kc = (keyStr.charAt(i) || "").trim();
    const ac = (ans.charAt(i) || "").trim().toUpperCase();
    if (!kc || kc === " ") continue;
    const ok = ac && ac !== "" && ac === kc;
    if (ok) continue;
    const st = !ac || ac === "" ? "Boş" : "Yanlış";
    const qNo = i + 1;
    const mq = mxByQ.get(qNo);
    const sid = mq?.subjectId || by[i]?.subjectId || "";
    const topicFromMx = mq?.topicName
      ? repairUtf8Mojibake(mq.topicName)
      : konuLabel(exam, i);
    const parsed = splitKonuKavram(topicFromMx);
    rows.push({
      q: qNo,
      branch: repairUtf8Mojibake(mq?.subjectName || bdsSubjectLabel(sid)),
      konu: parsed.konu || "—",
      kavram: parsed.kavram || "—",
      st,
      z: bdsZorlukLabel(zArr[i] ?? "1"),
    });
  }

  if (!rows.length) {
    rows.push({
      q: "—",
      branch: "—",
      konu: "Bu sınav için işaretlenmiş yanlış/boş soru yok veya cevap anahtarı eksik.",
      kavram: "—",
      st: "—",
      z: "—",
    });
  }

  const trs = rows
    .map(
      (row) =>
        `<tr><td class="bds-karne-mono text-center font-bold">${escapeHtml(String(row.q))}</td><td class="font-medium">${escapeHtml(row.branch)}</td><td>${escapeHtml(row.konu)}</td><td>${escapeHtml(row.kavram)}</td><td class="text-center font-bold">${escapeHtml(row.st)}</td><td class="text-center">${escapeHtml(row.z)}</td></tr>`
    )
    .join("");

  return `<div class="matrix-page bds-karne-matrix-page bds-print-block" style="page-break-before: always;"><div class="bds-karne-sec-title">Matris analizi <span class="bds-karne-sec-hint">Yanlış / boş sorular</span></div><div class="bds-karne-tablewrap overflow-x-auto rounded-xl border border-slate-200"><table class="bds-karne-table bds-karne-matrix-detail w-full text-[10px] sm:text-[11px]"><thead><tr><th class="text-center">Soru</th><th>Branş</th><th>Konu</th><th>Kavram</th><th class="text-center">Durum</th><th class="text-center">Zorluk</th></tr></thead><tbody>${trs}</tbody></table></div><p class="bds-karne-foot mt-3 text-[9px] text-slate-500">Kaynak: sınav matrisi ve öğrenci cevapları.</p></div>`;
}

/** Eski bds-karne öğrenci sayfası (fragment) */
export function buildSingleStudentKarnePage(
  exam: MergedExam,
  rec: ExamResultRow,
  rankMeta: ReturnType<typeof computeRankMeta>,
  kurumAdi = getKurumAdi()
): string {
  const layout = getExamLayout(exam.sinav);
  const keyStr = buildKeyStringFromExam(exam, layout.n);
  const ans = buildStudentAnswers(rec, layout.n);
  const key = studentRowKey(rec);
  const kurRank = rankMeta.genel[key] != null ? String(rankMeta.genel[key]) : "—";
  const subRank = rankMeta.sinif[key] != null ? String(rankMeta.sinif[key]) : "—";
  const T = Math.max(1, rankMeta.total || 1);
  const rNum = typeof rankMeta.genel[key] === "number" ? rankMeta.genel[key] : T;
  const pctile = Math.max(0, Math.min(100, Math.round((1 - (rNum - 1) / T) * 100)));
  const name = escapeHtml(rec.name || rec.studentName || "—");
  const no = escapeHtml(String(rec.studentCode || rec.studentId || "—"));
  const sube = escapeHtml(subeLabel(rec));
  const netTot =
    rec.net != null ? Number(rec.net).toFixed(2) : "0.00";
  const hasKey = keyStr.replace(/\s/g, "").length > 0;
  const allRows = resultsForExamInPool(exam.id);
  const sectionAvgs = computeSectionKurumAvgs(allRows, exam, layout, keyStr);

  const secRows = (layout.sections || [])
    .map((sec) => {
      const t = countDyn(ans, keyStr, sec.startQ - 1, sec.endQ);
      const nt = sectionNetVal(t);
      const avg = sectionAvgs[sec.title] ?? 0;
      const maxQ = sec.endQ - sec.startQ + 1;
      const studPct = maxQ > 0 ? Math.min(100, Math.max(0, (nt / maxQ) * 100)) : 0;
      const avgPct = maxQ > 0 ? Math.min(100, Math.max(0, (avg / maxQ) * 100)) : 0;
      const low = nt + 1e-6 < avg;
      const fillCls = low ? "bds-karne-vsbar-fill--low" : "bds-karne-vsbar-fill--ok";
      return `<tr><td class="font-semibold text-slate-900">${escapeHtml(sec.title)}</td><td class="bds-karne-mono text-center">${t.d}</td><td class="bds-karne-mono text-center">${t.y}</td><td class="bds-karne-mono text-center">${t.n}</td><td class="bds-karne-mono text-center font-extrabold text-slate-900">${nt.toFixed(2)}</td><td class="bds-karne-vsbar-cell"><div class="bds-karne-vsbar" title="Kurum ortalamasına göre"><div class="bds-karne-vsbar-fill ${fillCls}" style="width:${studPct.toFixed(1)}%"></div><div class="bds-karne-vsbar-marker" style="left:${avgPct.toFixed(1)}%"></div></div><div class="bds-karne-vsbar-cap">Ö&nbsp;${nt.toFixed(2)} · ø&nbsp;${avg.toFixed(2)}</div></td></tr>`;
    })
    .join("");

  const topicsBlock = buildWrongTopicsHtml(rec, exam);
  const page1 = `<section class="bds-karne-student-page bds-karne-student-page1 bds-karne-a4 bds-print-block"><header class="bds-karne-prem-head"><div class="bds-karne-prem-head__left"><div class="bds-karne-avatar-ph" aria-hidden="true"></div><div class="bds-karne-prem-head__meta"><p class="bds-karne-student__eyebrow">${escapeHtml(kurumAdi)}</p><h2 class="bds-karne-prem-name">${name}</h2><p class="bds-karne-prem-sub">No: <span class="font-mono font-bold">${no}</span> · Şube: ${sube} · Toplam net: <strong>${escapeHtml(netTot)}</strong></p><p class="bds-karne-student__meta">${escapeHtml(exam.name || exam.ad || exam.id)} · ${formatTrDate(exam.tarih || exam.date || "")} · ${escapeHtml(exam.sinav)}</p></div></div><div class="bds-karne-qr-ph" aria-hidden="true"><span class="bds-karne-qr-label">Doğrulama</span><div class="bds-karne-qr-grid"></div></div></header><div class="bds-karne-rank-grid bds-karne-rank-grid--3"><div class="bds-karne-rank-box bds-karne-rank-box--premium"><span class="bds-karne-rank-label">Kurum sırası</span><span class="bds-karne-rank-val">${escapeHtml(kurRank)}</span><span class="bds-karne-rank-sub">/ ${escapeHtml(String(T))}</span></div><div class="bds-karne-rank-box bds-karne-rank-box--premium"><span class="bds-karne-rank-label">Şube sırası</span><span class="bds-karne-rank-val">${escapeHtml(subRank)}</span><span class="bds-karne-rank-sub">şube içi</span></div><div class="bds-karne-rank-box bds-karne-rank-box--premium bds-karne-rank-box--accent"><span class="bds-karne-rank-label">Genel yüzdelik dilim</span><span class="bds-karne-rank-val">${escapeHtml(String(pctile))}%</span><span class="bds-karne-rank-sub">üst dilim</span></div></div><div class="bds-karne-sec-title">Branş analizi <span class="bds-karne-sec-hint">Kurum ortalamasına göre mini bar</span></div><div class="bds-karne-tablewrap overflow-x-auto rounded-xl border border-slate-200"><table class="bds-karne-table bds-karne-table--branch w-full text-[11px] sm:text-[12px]"><thead><tr><th>Ders / blok</th><th class="text-center">D</th><th class="text-center">Y</th><th class="text-center">B</th><th class="text-center">Net</th><th class="text-center">Kurum karşılaştırma</th></tr></thead><tbody>${secRows}</tbody></table></div><div class="bds-karne-sec-title">Dikkat edilmesi gereken konular <span class="bds-karne-sec-hint">Matrix · yanlış konular</span></div><div class="bds-karne-topics-wrap rounded-xl border border-rose-100 bg-rose-50/40 p-3">${topicsBlock}</div><p class="bds-karne-foot mt-4 text-[9px] leading-relaxed text-slate-500">Net = Doğru − Yanlış ÷ 4 (ÖSYM). ${hasKey ? "Branş dağılımı cevap anahtarı ile hesaplanmıştır." : "Anahtar eksikse bloklar soru aralığı üzerinden hesaplanır."}</p></section>`;
  const page2 = buildKarneMatrixWrongPage(exam, rec, layout, keyStr, ans);
  return `<div class="bds-karne-student-print-unit">${page1}${page2}</div>`;
}

export function buildKarneHtml(examId: string, studentId: string, kurumAdi?: string): string {
  const exam = findExamById(examId);
  if (!exam) return "<p>Sınav bulunamadı.</p>";
  const rec = findExamResultRow(examId, studentId);
  if (!rec) return "<p>Bu öğrenci için sonuç kaydı yok.</p>";
  const all = resultsForExamInPool(examId);
  const meta = computeRankMeta(all);
  const body = buildSingleStudentKarnePage(exam, rec, meta, kurumAdi);
  return karneDocumentShell(body, `Karne — ${rec.name || rec.studentName}`);
}

/** Modal için fragment (eski openModal) */
export function buildSelectedStudentKarnesFragment(
  exam: MergedExam,
  records: ExamResultRow[],
  kurumAdi = getKurumAdi()
): string {
  if (!records.length) {
    return '<p class="py-12 text-center text-slate-500">Seçili öğrenci yok.</p>';
  }
  const all = resultsForExamInPool(exam.id);
  const meta = computeRankMeta(all);
  return records
    .map((r) => buildSingleStudentKarnePage(exam, r, meta, kurumAdi))
    .join("");
}

export function buildSelectedStudentKarnesHTML(
  exam: MergedExam,
  records: ExamResultRow[],
  kurumAdi = getKurumAdi()
): string {
  const body = buildSelectedStudentKarnesFragment(exam, records, kurumAdi);
  return karneDocumentShell(body, `Öğrenci karneleri — ${exam.name || exam.ad}`);
}

/** @deprecated examId + studentIds — buildSelectedStudentKarnesFragment kullanın */
export function buildSelectedStudentKarnesHTMLByIds(
  examId: string,
  studentIds: string[],
  kurumAdi?: string
): string {
  const exam = findExamById(examId);
  if (!exam) return "";
  const all = resultsForExamInPool(examId);
  const records = studentIds
    .map((sid) =>
      all.find(
        (r) => String(r.studentId) === String(sid) || String(r.studentCode) === String(sid)
      )
    )
    .filter((r): r is ExamResultRow => !!r);
  return buildSelectedStudentKarnesHTML(exam, records, kurumAdi);
}

export function karneDocumentShell(body: string, title: string): string {
  return `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"/>
<title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="/styles/ogrenci-deneme-karne-screen.css" />
<link rel="stylesheet" href="/styles/print-a4-global.css" />
<link rel="stylesheet" href="/styles/sonuc-merkezi-print.css" />
<style>
body{margin:0;color:#0f172a;font-family:Inter,system-ui,sans-serif;background:#fff;box-sizing:border-box}
*,*::before,*::after{box-sizing:inherit}
@media print{
  @page{size:A4 portrait;margin:0}
  body.print-safe-area{
    padding:11mm 10mm!important;
    box-sizing:border-box!important;
  }
}
</style>
</head><body class="print-safe-area">${body}</body></html>`;
}

export function resolveExamTitle(examId: string, results: ExamResultRow[]): string {
  const ex = findExamById(examId);
  if (ex) return ex.name || ex.ad || examId;
  const r = results.find((x) => String(x.examId) === String(examId));
  return r?.examName || examId;
}
