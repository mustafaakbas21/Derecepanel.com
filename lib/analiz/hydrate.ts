import type { AnalizData, AnalizExamShell, AnalizScope, AnalizStudent } from "@/lib/analiz/types";
import { buildDyBSummaryGauges } from "@/lib/analiz/chart-fallbacks";
import { buildSubjectGaugesForExam } from "@/lib/analiz/build-subject-gauges";
import { readAnalizExamResults } from "@/lib/analiz/exam-results-source";
import { buildKeyStringFromExam } from "@/lib/exams/exam-evaluate";
import { getExamLayout } from "@/lib/exams/exam-layout";
import { computeRankMeta, studentRowKey } from "@/lib/exams/exam-rank";
import { loadMergedExams } from "@/lib/exams/exam-storage";
import { loadCatalogStudents } from "@/lib/exams/student-catalog-bridge";
import type { ExamResultRow } from "@/lib/exams/types";
import { loadStudentsFull } from "@/lib/students/storage";

function emptyShell(name: string, date: string, scope: AnalizScope): AnalizExamShell {
  return {
    name,
    date,
    scope,
    kpi: {
      avgNet: 0,
      avgDelta: 0,
      avgMax: 120,
      attendance: { done: 0, total: 0 },
      bestSubject: null,
      drop: null,
    },
    classes: { labels: [], correct: [], wrong: [], empty: [] },
    subjectGauges: [],
    subjectGaugeMode: "summary",
    insight: "",
    priorityInsight: "",
    priority: [],
    students: [],
  };
}

function buildStudentMap() {
  const map = new Map<
    string,
    { name?: string; meta?: string; codes: Set<string> }
  >();

  const add = (id: string, name?: string, meta?: string, code?: string) => {
    const key = String(id || code || "").trim();
    if (!key) return;
    const prev = map.get(key) || { name, meta, codes: new Set<string>() };
    if (name) prev.name = name;
    if (meta) prev.meta = meta;
    if (code) prev.codes.add(String(code).trim());
    map.set(key, prev);
  };

  loadStudentsFull({ seedIfEmpty: false }).forEach((st) => {
    add(st.ogrenciId, st.name, st.sinifBranch || "", st.studentCode);
    if (st.studentCode) add(st.studentCode, st.name, st.sinifBranch || "", st.studentCode);
  });

  loadCatalogStudents().forEach((st) => {
    add(st.id, st.name, st.sube || "", st.code);
    if (st.code) add(st.code, st.name, st.sube || "", st.code);
  });

  return map;
}

function resolveStudentDisplay(
  r: ExamResultRow,
  stuMap: ReturnType<typeof buildStudentMap>
): { id: string; name: string; meta: string } {
  const sid = String(r.studentId || "").trim();
  const scode = String(r.studentCode || "").trim();
  const st =
    (sid ? stuMap.get(sid) : undefined) || (scode ? stuMap.get(scode) : undefined);
  const id = sid || scode || String(r.name || "").trim();
  const name = r.name || r.studentName || st?.name || id || "Öğrenci";
  const meta =
    st?.meta ||
    String(r.sube || "").trim() ||
    (r.book ? `Kitap: ${r.book}` : "") ||
    "";
  return { id, name, meta };
}

function rankLabel(meta: ReturnType<typeof computeRankMeta>, row: ExamResultRow): string {
  const key = studentRowKey(row);
  const g = meta.genel[key];
  return g != null ? String(g) : "—";
}

function percentileLabel(meta: ReturnType<typeof computeRankMeta>, row: ExamResultRow): string {
  const key = studentRowKey(row);
  const g = meta.genel[key];
  const total = meta.total;
  if (typeof g !== "number" || total <= 0) return "—";
  return `%${Math.max(0, Math.min(100, Math.round((1 - (g - 1) / total) * 100)))}`;
}

export function buildAggregatesForExam(
  ex: AnalizExamShell,
  examRows: ExamResultRow[],
  exam: ReturnType<typeof loadMergedExams>[0] | undefined,
  enrollmentTotal: number
) {
  const stu = ex.students || [];
  const byClass: Record<string, { c: number; w: number; b: number }> = {};
  let totC = 0;
  let totW = 0;
  let totB = 0;

  stu.forEach((s) => {
    const cname = String(s.meta || "Genel").split("·")[0]?.trim() || "Genel";
    if (!byClass[cname]) byClass[cname] = { c: 0, w: 0, b: 0 };
    const c = Number(s.correct) || 0;
    const w = Number(s.wrong) || 0;
    const b = Number(s.blank) || 0;
    byClass[cname].c += c;
    byClass[cname].w += w;
    byClass[cname].b += b;
    totC += c;
    totW += w;
    totB += b;
  });

  if (!Object.keys(byClass).length) {
    ex.classes = { labels: ["Genel"], correct: [0], wrong: [0], empty: [0] };
  } else {
    const keys = Object.keys(byClass);
    ex.classes = {
      labels: keys,
      correct: keys.map((k) => byClass[k]!.c),
      wrong: keys.map((k) => byClass[k]!.w),
      empty: keys.map((k) => byClass[k]!.b),
    };
  }

  if (exam && examRows.length) {
    const built = buildSubjectGaugesForExam(exam, examRows, {
      avgNet: ex.kpi.avgNet,
      enrollmentTotal,
    });
    ex.subjectGauges = built.gauges;
    ex.subjectGaugeMode = built.mode;
    if (built.mode !== "summary") {
      const best = ex.subjectGauges[0];
      const weak = ex.subjectGauges[ex.subjectGauges.length - 1];
      ex.kpi.bestSubject = best ? { name: best.name, rate: best.rate } : null;
      ex.kpi.drop =
        weak && best && weak.name !== best.name
          ? { name: weak.name, delta: Math.round((best.rate - weak.rate) * 10) / 10 }
          : null;
    } else {
      ex.kpi.bestSubject = null;
      ex.kpi.drop = null;
    }
  } else if (!ex.subjectGauges.length && stu.length) {
    const avgN = ex.kpi.avgNet ?? 0;
    const enroll = Math.max(enrollmentTotal || stu.length, 1);
    ex.subjectGauges = buildDyBSummaryGauges({
      correct: totC,
      wrong: totW,
      blank: totB,
      avgNet: avgN,
      studentCount: stu.length,
      enrollmentTotal: enroll,
    });
    ex.subjectGaugeMode = "summary";
    ex.kpi.bestSubject = null;
    ex.kpi.drop = null;
  }

  const avgN = ex.kpi.avgNet ?? 0;
  const enroll = Math.max(enrollmentTotal || stu.length, 1);
  const partPct = Math.min(100, Math.round((1000 * stu.length) / enroll) / 10);

  ex.insight =
    stu.length === 0
      ? "Bu sınav için henüz sonuç kaydı yok — Sonuç Merkezi üzerinden kurumsal/global yükleme yapın."
      : `Sınav ortalaması ${avgN.toFixed(1)} net; ${stu.length} katılım (kayıtlı ${enroll} öğrenci, %${partPct}). Veri: examResults + ${exam?.isGlobal ? "global" : "kurumsal"} takvim.`;

  ex.priorityInsight =
    "Otonom öncelik: sınıf doğruluğu %50 altı konular Tab 3'te (cevap anahtarı + optik sonuçları).";
}

/** Kurumsal + global takvim + examResults — Sonuç Merkezi ile aynı kaynak */
export function hydrateFromLocalStorage(): AnalizData {
  const merged = loadMergedExams();
  const results = readAnalizExamResults();
  const students = loadStudentsFull({ seedIfEmpty: false });
  const catalog = loadCatalogStudents();
  const enrollmentTotal = Math.max(students.length, catalog.length);

  const stuMap = buildStudentMap();
  const exams: Record<string, AnalizExamShell> = {};
  const examList: AnalizData["examList"] = [];
  const examById = new Map(merged.map((e) => [e.id, e]));

  merged.forEach((e) => {
    const scope: AnalizScope = e.isGlobal ? "global" : "kurumsal";
    const name = e.name || e.ad || e.id;
    const date = e.tarih || e.date || "";
    examList.push({ id: e.id, name, date, scope });
    exams[e.id] = emptyShell(name, date, scope);
  });

  const rowsByExam = new Map<string, ExamResultRow[]>();
  results.forEach((r) => {
    if (!r?.examId) return;
    const eid = String(r.examId);
    if (!exams[eid]) return;
    if (!rowsByExam.has(eid)) rowsByExam.set(eid, []);
    rowsByExam.get(eid)!.push(r);
  });

  rowsByExam.forEach((examRows, eid) => {
    const ex = exams[eid]!;
    const rankMeta = computeRankMeta(examRows);

    examRows.forEach((r) => {
      const { id, name, meta } = resolveStudentDisplay(r, stuMap);
      const student: AnalizStudent = {
        id,
        name,
        meta,
        net: Number(r.net) || 0,
        correct: Number(r.correct) || 0,
        wrong: Number(r.wrong) || 0,
        blank: Number(r.blank) || 0,
        rank: rankLabel(rankMeta, r),
        percentile: percentileLabel(rankMeta, r),
      };
      ex.students.push(student);
    });

    ex.students.sort((a, b) => b.net - a.net);

    const nets = ex.students.map((s) => s.net);
    const sum = nets.reduce((a, b) => a + b, 0);
    const avg = sum / nets.length;
    const max = Math.max(...nets, 0);
    ex.kpi.avgNet = Math.round(avg * 10) / 10;
    ex.kpi.avgMax = Math.max(max, 120);
    ex.kpi.attendance = { done: ex.students.length, total: enrollmentTotal };

    buildAggregatesForExam(ex, examRows, examById.get(eid), enrollmentTotal);
  });

  examList.sort((a, b) => String(b.date).localeCompare(String(a.date)));

  return { exams, enrollmentTotal, examList };
}

export function getAnswerKeyForExamId(examId: string): string {
  const ex = loadMergedExams().find((e) => e.id === examId);
  if (!ex) return "";
  const layout = getExamLayout(ex.sinav);
  return buildKeyStringFromExam(ex, layout.n);
}
