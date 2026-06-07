import { getTopicTier, TIER_LABELS } from "@/lib/analiz/otonom-v3";
import type { QuestionResultCell } from "@/lib/analiz/error-karne";
import type { SubjectMasteryRow } from "@/lib/analiz/subject-mastery";
import type { AnalizExamShell, AnalizStudent, PriorityRow } from "@/lib/analiz/types";
import { getKurumAdi } from "@/lib/exams/institution";
import { karneDocumentShell } from "@/lib/karne";

function escapeHtml(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatTrDate(d: string): string {
  if (!d || d.length < 10) return d || "—";
  const p = d.split("-");
  if (p.length < 3) return d || "—";
  return `${p[2]}.${p[1]}.${p[0]}`;
}

function sectionTitle(text: string) {
  return `<h4 class="am-report-section-title">${escapeHtml(text)}</h4>`;
}

function tableWrap(head: string, body: string, note = "") {
  return `${note}<div class="bds-karne-tablewrap overflow-x-auto rounded-2xl border border-slate-200 shadow-sm"><table class="bds-karne-table bds-karne-table--kurum-premium w-full border-collapse text-[11px] sm:text-xs"><thead>${head}</thead><tbody>${body}</tbody></table></div>`;
}

function priorityStatus(rate: number): string {
  const tier = getTopicTier(rate);
  return tier === "kritik" ? TIER_LABELS.kritik : TIER_LABELS.dikkat;
}

export type BuildAnalizReportParams = {
  exam: AnalizExamShell;
  classFilter: string;
  attendPct: number;
  priorityRows: PriorityRow[];
  students: AnalizStudent[];
  selectedStudent: AnalizStudent | null;
  studentTopicRows: { name: string; rate: number }[];
  crossStudentName: string;
  crossMastery: SubjectMasteryRow[];
  crossSummary: {
    examCount: number;
    correct: number;
    wrong: number;
    empty: number;
    avgRate: number;
  };
  errorCells: QuestionResultCell[];
  kurumAdi?: string;
};

export function buildAnalizReportFragment(params: BuildAnalizReportParams): string {
  const {
    exam,
    classFilter,
    attendPct,
    priorityRows,
    students,
    selectedStudent,
    studentTopicRows,
    crossStudentName,
    crossMastery,
    crossSummary,
    errorCells,
    kurumAdi = getKurumAdi(),
  } = params;

  const classLabel = classFilter === "all" ? "Tüm sınıflar" : classFilter;
  const generated = new Date().toLocaleString("tr-TR");
  const kritikCount = priorityRows.filter((r) => r.classCorrectRate < 40).length;
  const dikkatCount = priorityRows.filter(
    (r) => r.classCorrectRate >= 40 && r.classCorrectRate < 50
  ).length;

  const kpiBlock = `<div class="am-report-kpi-grid">
    <div class="am-report-kpi"><span>Ortalama net</span><strong>${escapeHtml(String(exam.kpi.avgNet))}</strong></div>
    <div class="am-report-kpi"><span>Katılım</span><strong>${escapeHtml(String(exam.kpi.attendance.done))} / ${escapeHtml(String(exam.kpi.attendance.total))}</strong></div>
    <div class="am-report-kpi"><span>Katılım oranı</span><strong>%${attendPct}</strong></div>
    <div class="am-report-kpi"><span>Kritik soru</span><strong>${kritikCount}</strong></div>
    <div class="am-report-kpi"><span>Dikkat soru</span><strong>${dikkatCount}</strong></div>
  </div>`;

  const gaugeHead =
    "<tr><th>Ders</th><th class=\"text-center\">Doğruluk %</th></tr>";
  const gaugeBody = exam.subjectGauges.length
    ? exam.subjectGauges
        .map((g, i) => {
          const zebra = i % 2 === 0 ? "bds-karne-table__row--a" : "bds-karne-table__row--b";
          return `<tr class="${zebra}"><td class="font-semibold text-slate-900">${escapeHtml(g.name)}</td><td class="text-center font-bold">${escapeHtml(String(g.rate))}%</td></tr>`;
        })
        .join("")
    : '<tr><td colspan="2" class="py-6 text-center text-slate-500">Ders özeti yok</td></tr>';

  const classHead =
    "<tr><th>Şube</th><th class=\"text-center\">Doğru</th><th class=\"text-center\">Yanlış</th><th class=\"text-center\">Boş</th></tr>";
  const classBody = exam.classes.labels.length
    ? exam.classes.labels
        .map((label, i) => {
          const zebra = i % 2 === 0 ? "bds-karne-table__row--a" : "bds-karne-table__row--b";
          return `<tr class="${zebra}"><td class="font-semibold">${escapeHtml(label)}</td><td class="text-center">${exam.classes.correct[i] ?? 0}</td><td class="text-center">${exam.classes.wrong[i] ?? 0}</td><td class="text-center">${exam.classes.empty[i] ?? 0}</td></tr>`;
        })
        .join("")
    : '<tr><td colspan="4" class="py-6 text-center text-slate-500">Şube verisi yok</td></tr>';

  const sortedStudents = [...students].sort((a, b) => b.net - a.net).slice(0, 25);
  const studentHead =
    "<tr><th>Sıra</th><th>Öğrenci</th><th class=\"text-center\">Net</th><th class=\"text-center\">D</th><th class=\"text-center\">Y</th><th class=\"text-center\">B</th><th>Not</th></tr>";
  const studentBody = sortedStudents.length
    ? sortedStudents
        .map((s, i) => {
          const zebra = i % 2 === 0 ? "bds-karne-table__row--a" : "bds-karne-table__row--b";
          return `<tr class="${zebra}"><td class="bds-karne-table__rank">${i + 1}</td><td class="font-semibold">${escapeHtml(s.name)}</td><td class="text-center font-extrabold">${escapeHtml(String(s.net))}</td><td class="text-center">${s.correct}</td><td class="text-center">${s.wrong}</td><td class="text-center">${s.blank}</td><td class="text-slate-600">${escapeHtml(s.meta)}</td></tr>`;
        })
        .join("")
    : '<tr><td colspan="7" class="py-6 text-center text-slate-500">Öğrenci yok</td></tr>';

  const priorityHead =
    "<tr><th>Durum</th><th>Ders</th><th>Konu</th><th class=\"text-center\">Soru</th><th class=\"text-center\">Sınıf %</th></tr>";
  const priorityBody = priorityRows.length
    ? priorityRows
        .map((r, i) => {
          const zebra = i % 2 === 0 ? "bds-karne-table__row--a" : "bds-karne-table__row--b";
          const st = priorityStatus(r.classCorrectRate);
          return `<tr class="${zebra}"><td class="font-bold ${r.classCorrectRate < 40 ? "text-rose-800" : "text-amber-800"}">${escapeHtml(st)}</td><td>${escapeHtml(r.subjectName)}</td><td class="font-semibold">${escapeHtml(r.topicName)}</td><td class="bds-karne-mono text-center">S${r.qNo}</td><td class="text-center font-bold">%${r.classCorrectRate}</td></tr>`;
        })
        .join("")
    : '<tr><td colspan="5" class="py-6 text-center text-slate-500">%50 altı öncelikli soru yok</td></tr>';

  let individualBlock = "";
  if (selectedStudent) {
    const topicHead = "<tr><th>Konu</th><th class=\"text-center\">Başarı %</th></tr>";
    const topicBody = studentTopicRows.length
      ? studentTopicRows
          .map((t, i) => {
            const zebra = i % 2 === 0 ? "bds-karne-table__row--a" : "bds-karne-table__row--b";
            return `<tr class="${zebra}"><td class="font-semibold">${escapeHtml(t.name)}</td><td class="text-center font-bold">%${t.rate}</td></tr>`;
          })
          .join("")
      : '<tr><td colspan="2" class="py-6 text-center text-slate-500">Konu kırılımı yok</td></tr>';

    individualBlock = `<section class="am-report-section bds-print-block">
      ${sectionTitle(`Bireysel · ${selectedStudent.name}`)}
      <p class="am-report-note">Net: <strong>${escapeHtml(String(selectedStudent.net))}</strong> · Sıra: ${escapeHtml(selectedStudent.rank)} · Yüzdelik: ${escapeHtml(selectedStudent.percentile)}</p>
      ${tableWrap(topicHead, topicBody)}
    </section>`;
  }

  let errorBlock = "";
  if (errorCells.length) {
    const errHead =
      "<tr><th>Soru</th><th>Sonuç</th><th>Ders</th><th>Konu</th><th class=\"text-center\">Sınıf %</th></tr>";
    const errRows = errorCells.filter((c) => c.result !== "correct").slice(0, 80);
    const errBody = errRows
      .map((c, i) => {
        const zebra = i % 2 === 0 ? "bds-karne-table__row--a" : "bds-karne-table__row--b";
        const res = c.result === "wrong" ? "Yanlış" : "Boş";
        return `<tr class="${zebra}"><td class="bds-karne-mono font-bold">S${c.qNo}</td><td class="${c.result === "wrong" ? "text-rose-800 font-bold" : "text-amber-800 font-bold"}">${res}</td><td>${escapeHtml(c.subjectName)}</td><td>${escapeHtml(c.topicName)}</td><td class="text-center">%${c.classRate}</td></tr>`;
      })
      .join("");
    errorBlock = `<section class="am-report-section bds-print-block">
      ${sectionTitle(`Hata karnesi · ${selectedStudent?.name || crossStudentName || "Öğrenci"}`)}
      <p class="am-report-note">${errRows.length} yanlış/boş soru listeleniyor (en fazla 80).</p>
      ${tableWrap(errHead, errBody)}
    </section>`;
  }

  let masteryBlock = "";
  if (crossMastery.length && crossStudentName) {
    const mHead =
      "<tr><th>Ders</th><th>Konu</th><th class=\"text-center\">D</th><th class=\"text-center\">Y</th><th class=\"text-center\">B</th><th class=\"text-center\">%</th><th>Trend</th></tr>";
    const mBody = crossMastery
      .slice(0, 100)
      .map((r, i) => {
        const zebra = i % 2 === 0 ? "bds-karne-table__row--a" : "bds-karne-table__row--b";
        const trend =
          r.trend === "up" ? "↑ Yükseliş" : r.trend === "down" ? "↓ Düşüş" : "→ Sabit";
        return `<tr class="${zebra}"><td>${escapeHtml(r.subjectName)}</td><td class="font-semibold">${escapeHtml(r.topicName)}</td><td class="text-center">${r.correct}</td><td class="text-center">${r.wrong}</td><td class="text-center">${r.empty}</td><td class="text-center font-bold">%${r.rate}</td><td class="text-center text-xs">${trend}</td></tr>`;
      })
      .join("");
    masteryBlock = `<section class="am-report-section bds-print-block">
      ${sectionTitle(`Konu hakimiyeti (cross) · ${crossStudentName}`)}
      <p class="am-report-note">${crossSummary.examCount} sınav · ${crossSummary.correct} doğru · ${crossSummary.wrong} yanlış · ${crossSummary.empty} boş · Ort. %${crossSummary.avgRate}</p>
      ${tableWrap(mHead, mBody)}
    </section>`;
  }

  const insightNote = exam.insight
    ? `<p class="bds-karne-note mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[11px] font-medium text-slate-700">${escapeHtml(exam.insight)}</p>`
    : "";

  return `<div class="bds-print-block bds-karne-kurum am-report-root mx-auto max-w-[100%]">
    <header class="bds-karne-kurum-premium mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-stretch sm:justify-between">
      <div class="flex min-w-0 flex-1 gap-4">
        <div class="bds-karne-logo-ph shrink-0" aria-hidden="true">LOGO</div>
        <div class="min-w-0 text-left">
          <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">${escapeHtml(kurumAdi)}</p>
          <h3 class="mt-1 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">Analiz &amp; Raporlama Merkezi</h3>
          <p class="mt-1 text-sm text-slate-600"><strong>${escapeHtml(exam.name)}</strong> · ${formatTrDate(exam.date)}</p>
          <p class="mt-1 text-xs text-slate-500">Sınıf: ${escapeHtml(classLabel)} · Rapor: ${escapeHtml(generated)}</p>
        </div>
      </div>
      <div class="bds-karne-kurum-stats shrink-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm shadow-sm">
        <div class="font-bold text-slate-900">Özet</div>
        <div class="mt-2 space-y-1 text-slate-700">
          <div>Öğrenci: <strong>${students.length}</strong></div>
          <div>Otonom öncelik: <strong>${priorityRows.length}</strong> soru</div>
        </div>
      </div>
    </header>
    ${insightNote}
    ${kpiBlock}
    <section class="am-report-section bds-print-block">${sectionTitle("Kurum / sınıf özeti")}${tableWrap(gaugeHead, gaugeBody)}</section>
    <section class="am-report-section bds-print-block">${sectionTitle("Şube dağılımı")}${tableWrap(classHead, classBody)}</section>
    <section class="am-report-section bds-print-block">${sectionTitle("Öğrenci sıralaması (ilk 25)")}${tableWrap(studentHead, studentBody)}</section>
    <section class="am-report-section bds-print-block">${sectionTitle("OTONOM · öncelikli konular")}<p class="am-report-note">Sınıf doğruluğu %50 altı — ${priorityRows.length} soru.</p>${tableWrap(priorityHead, priorityBody)}</section>
    ${individualBlock}
    ${errorBlock}
    ${masteryBlock}
  </div>`;
}

export function buildAnalizReportHTML(params: BuildAnalizReportParams): string {
  const title = `Analiz raporu — ${params.exam.name}`;
  return karneDocumentShell(buildAnalizReportFragment(params), title);
}

export type BuildStudentAnalizReportParams = {
  exam: AnalizExamShell;
  student: AnalizStudent;
  studentTopicRows: { name: string; rate: number }[];
  priorityRows: PriorityRow[];
  crossMastery: SubjectMasteryRow[];
  crossSummary: {
    examCount: number;
    correct: number;
    wrong: number;
    empty: number;
    avgRate: number;
  };
  errorCells: QuestionResultCell[];
  kurumAdi?: string;
};

/** Öğrenci paneli — yalnızca giriş yapan öğrencinin bireysel analizi */
export function buildStudentAnalizReportFragment(params: BuildStudentAnalizReportParams): string {
  const {
    exam,
    student,
    studentTopicRows,
    priorityRows,
    crossMastery,
    crossSummary,
    errorCells,
    kurumAdi = getKurumAdi(),
  } = params;

  const generated = new Date().toLocaleString("tr-TR");
  const totalQ = student.correct + student.wrong + student.blank;
  const accuracyPct = totalQ > 0 ? Math.round((1000 * student.correct) / totalQ) / 10 : 0;

  const studentKpi = `<div class="am-report-kpi-grid">
    <div class="am-report-kpi"><span>Net</span><strong>${escapeHtml(String(student.net))}</strong></div>
    <div class="am-report-kpi"><span>Sıra</span><strong>${escapeHtml(student.rank)}</strong></div>
    <div class="am-report-kpi"><span>Yüzdelik</span><strong>${escapeHtml(student.percentile)}</strong></div>
    <div class="am-report-kpi"><span>Doğruluk</span><strong>%${accuracyPct}</strong></div>
    <div class="am-report-kpi"><span>Kurum ort.</span><strong>${escapeHtml(String(exam.kpi.avgNet))} net</strong></div>
  </div>`;

  const topicHead = "<tr><th>Konu / ders</th><th class=\"text-center\">Başarı %</th></tr>";
  const topicBody = studentTopicRows.length
    ? studentTopicRows
        .map((t, i) => {
          const zebra = i % 2 === 0 ? "bds-karne-table__row--a" : "bds-karne-table__row--b";
          return `<tr class="${zebra}"><td class="font-semibold text-slate-900">${escapeHtml(t.name)}</td><td class="text-center font-bold">%${t.rate}</td></tr>`;
        })
        .join("")
    : '<tr><td colspan="2" class="py-6 text-center text-slate-500">Konu kırılımı için matris ve cevap anahtarı gerekli</td></tr>';

  const priorityHead =
    "<tr><th>Durum</th><th>Ders</th><th>Konu</th><th class=\"text-center\">Soru</th><th class=\"text-center\">Sınıf %</th></tr>";
  const priorityBody = priorityRows.length
    ? priorityRows
        .map((r, i) => {
          const zebra = i % 2 === 0 ? "bds-karne-table__row--a" : "bds-karne-table__row--b";
          const st = priorityStatus(r.classCorrectRate);
          return `<tr class="${zebra}"><td class="font-bold ${r.classCorrectRate < 40 ? "text-rose-800" : "text-amber-800"}">${escapeHtml(st)}</td><td>${escapeHtml(r.subjectName)}</td><td class="font-semibold">${escapeHtml(r.topicName)}</td><td class="bds-karne-mono text-center">S${r.qNo}</td><td class="text-center font-bold">%${r.classCorrectRate}</td></tr>`;
        })
        .join("")
    : '<tr><td colspan="5" class="py-6 text-center text-slate-500">Bu sınavda öncelikli konu yok</td></tr>';

  const errHead =
    "<tr><th>Soru</th><th>Sonuç</th><th>Ders</th><th>Konu</th><th class=\"text-center\">Sınıf %</th></tr>";
  const errRows = errorCells.filter((c) => c.result !== "correct").slice(0, 120);
  const errBody = errRows.length
    ? errRows
        .map((c, i) => {
          const zebra = i % 2 === 0 ? "bds-karne-table__row--a" : "bds-karne-table__row--b";
          const res = c.result === "wrong" ? "Yanlış" : "Boş";
          return `<tr class="${zebra}"><td class="bds-karne-mono font-bold">S${c.qNo}</td><td class="${c.result === "wrong" ? "text-rose-800 font-bold" : "text-amber-800 font-bold"}">${res}</td><td>${escapeHtml(c.subjectName)}</td><td>${escapeHtml(c.topicName)}</td><td class="text-center">%${c.classRate}</td></tr>`;
        })
        .join("")
    : '<tr><td colspan="5" class="py-6 text-center text-slate-500">Yanlış veya boş soru yok</td></tr>';

  const mHead =
    "<tr><th>Ders</th><th>Konu</th><th class=\"text-center\">D</th><th class=\"text-center\">Y</th><th class=\"text-center\">B</th><th class=\"text-center\">%</th><th>Trend</th></tr>";
  const mBody = crossMastery.length
    ? crossMastery
        .slice(0, 100)
        .map((r, i) => {
          const zebra = i % 2 === 0 ? "bds-karne-table__row--a" : "bds-karne-table__row--b";
          const trend =
            r.trend === "up" ? "↑ Yükseliş" : r.trend === "down" ? "↓ Düşüş" : "→ Sabit";
          return `<tr class="${zebra}"><td>${escapeHtml(r.subjectName)}</td><td class="font-semibold">${escapeHtml(r.topicName)}</td><td class="text-center">${r.correct}</td><td class="text-center">${r.wrong}</td><td class="text-center">${r.empty}</td><td class="text-center font-bold">%${r.rate}</td><td class="text-center text-xs">${trend}</td></tr>`;
        })
        .join("")
    : '<tr><td colspan="7" class="py-6 text-center text-slate-500">Çoklu sınav hakimiyet verisi yok</td></tr>';

  return `<div class="bds-print-block bds-karne-kurum am-report-root mx-auto max-w-[100%]">
    <header class="bds-karne-kurum-premium mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-stretch sm:justify-between">
      <div class="flex min-w-0 flex-1 gap-4">
        <div class="bds-karne-logo-ph shrink-0" aria-hidden="true">LOGO</div>
        <div class="min-w-0 text-left">
          <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">${escapeHtml(kurumAdi)}</p>
          <h3 class="mt-1 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">Analiz Raporum</h3>
          <p class="mt-1 text-sm text-slate-600"><strong>${escapeHtml(student.name)}</strong> · ${escapeHtml(exam.name)} · ${formatTrDate(exam.date)}</p>
          <p class="mt-1 text-xs text-slate-500">${escapeHtml(student.meta || "Öğrenci")} · Rapor: ${escapeHtml(generated)}</p>
        </div>
      </div>
      <div class="bds-karne-kurum-stats shrink-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm shadow-sm">
        <div class="font-bold text-slate-900">Sonuç özeti</div>
        <div class="mt-2 space-y-1 text-slate-700">
          <div>Net: <strong>${escapeHtml(String(student.net))}</strong></div>
          <div>Doğru: <strong>${student.correct}</strong> · Yanlış: <strong>${student.wrong}</strong> · Boş: <strong>${student.blank}</strong></div>
        </div>
      </div>
    </header>
    ${studentKpi}
    <section class="am-report-section bds-print-block">
      ${sectionTitle("Konu bazlı performansım")}
      <p class="am-report-note">Bu sınavdaki ders ve konu doğruluk oranlarınız.</p>
      ${tableWrap(topicHead, topicBody)}
    </section>
    <section class="am-report-section bds-print-block">
      ${sectionTitle("Öncelikli konularım")}
      <p class="am-report-note">Yanlış/boş sorularınıza göre çalışmanız gereken konular — ${priorityRows.length} kayıt.</p>
      ${tableWrap(priorityHead, priorityBody)}
    </section>
    <section class="am-report-section bds-print-block">
      ${sectionTitle("Hata karnem")}
      <p class="am-report-note">${errRows.length} yanlış/boş soru listeleniyor.</p>
      ${tableWrap(errHead, errBody)}
    </section>
    <section class="am-report-section bds-print-block">
      ${sectionTitle("Konu hakimiyetim")}
      <p class="am-report-note">${crossSummary.examCount} sınav · ${crossSummary.correct} doğru · ${crossSummary.wrong} yanlış · ${crossSummary.empty} boş · Ort. %${crossSummary.avgRate}</p>
      ${tableWrap(mHead, mBody)}
    </section>
  </div>`;
}

export function buildStudentAnalizReportHTML(params: BuildStudentAnalizReportParams): string {
  const title = `Analiz raporum — ${params.student.name} · ${params.exam.name}`;
  return karneDocumentShell(buildStudentAnalizReportFragment(params), title);
}
