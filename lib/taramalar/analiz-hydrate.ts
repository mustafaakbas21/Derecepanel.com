import { panelGetItem, panelKeys } from "@/lib/panel-store";
import { STORAGE_KEYS, TARAMA_LS } from "@/lib/taramalar/constants";
import type { TaramaExamResult, TaramaExamShell } from "@/lib/taramalar/types";
import { loadStudentsFull } from "@/lib/students/storage";

function readJsonArray<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = panelGetItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function emptyExamShell(
  name: string,
  date: string,
  raw: { soruSayisi?: number; cevapAnahtari?: string; insight?: string } | null
): TaramaExamShell {
  const nQ = raw?.soruSayisi ? Math.max(1, Number(raw.soruSayisi)) : 20;
  return {
    name,
    date: date || "",
    scope: "tarama",
    soruSayisi: nQ,
    kpi: {
      avgNet: 0,
      avgDelta: 0,
      avgMax: 0,
      attendance: { done: 0, total: 0 },
      bestSubject: null,
      drop: null,
    },
    classes: { labels: [], correct: [], wrong: [], empty: [] },
    subjectGauges: [],
    insight: raw?.insight || "",
    priorityInsight: "",
    priority: [],
    students: [],
    cevapAnahtari: raw?.cevapAnahtari || "",
  };
}

export function loadTaramaResults(): TaramaExamResult[] {
  return readJsonArray<TaramaExamResult>(TARAMA_LS.examResults);
}

export function hydrateTaramaExams(): Record<string, TaramaExamShell> {
  if (typeof window === "undefined") return {};

  const seen: Record<string, 1> = {};
  const examList: { id: string; name: string; date: string; raw: unknown }[] = [];

  function pushExam(
    id: string,
    name: string,
    date: string,
    raw: unknown
  ) {
    if (!id || seen[id]) return;
    seen[id] = 1;
    examList.push({ id: String(id), name: name || String(id), date: date || "", raw });
  }

  readJsonArray<{ id?: string; name?: string; title?: string; savedAt?: string; date?: string }>(
    STORAGE_KEYS.exports
  ).forEach((e) => {
    if (!e?.id) return;
    pushExam(e.id, e.name || e.title || e.id, e.savedAt || e.date || "", e);
  });

  for (const lk of panelKeys()) {
    if (!lk.startsWith(TARAMA_LS.taramaDataPrefix)) continue;
    const tid = lk.slice(TARAMA_LS.taramaDataPrefix.length);
    if (!tid || seen[tid]) continue;
    let obj: { name?: string; savedAt?: string; updatedAt?: string; soruSayisi?: number; cevapAnahtari?: string } | null =
      null;
    try {
      obj = JSON.parse(panelGetItem(lk) || "null");
    } catch {
      obj = null;
    }
    pushExam(
      tid,
      obj?.name || tid,
      obj?.savedAt || obj?.updatedAt || "",
      obj
    );
  }

  const results = loadTaramaResults();
  const students = loadStudentsFull({ seedIfEmpty: true });
  const enrollmentTotal = students.length;

  const stuMap: Record<string, { name?: string; meta?: string; class?: string; sube?: string }> =
    {};
  students.forEach((st) => {
    stuMap[st.ogrenciId] = {
      name: st.name,
      meta: st.sinifBranch,
      sube: st.sinifBranch,
    };
  });

  const exams: Record<string, TaramaExamShell> = {};

  examList.forEach((e) => {
    const raw = (e.raw || {}) as {
      soruSayisi?: number;
      cevapAnahtari?: string;
      kpi?: TaramaExamShell["kpi"];
      classes?: TaramaExamShell["classes"];
      subjectGauges?: TaramaExamShell["subjectGauges"];
      insight?: string;
      priorityInsight?: string;
      priority?: unknown[];
    };
    let nQ = 20;
    let cevap = "";
    try {
      const td = JSON.parse(panelGetItem(`tarama_data_${e.id}`) || "null") as {
        soruSayisi?: number;
        cevapAnahtari?: string;
      } | null;
      if (td?.soruSayisi) nQ = Math.max(1, Number(td.soruSayisi));
      if (td?.cevapAnahtari != null) cevap = String(td.cevapAnahtari);
    } catch {
      /* ignore */
    }
    if (raw?.soruSayisi) nQ = Math.max(nQ, Number(raw.soruSayisi));
    if (raw?.cevapAnahtari != null && !cevap) cevap = String(raw.cevapAnahtari);

    exams[e.id] = {
      ...emptyExamShell(e.name, e.date, { soruSayisi: nQ, cevapAnahtari: cevap }),
      kpi: raw.kpi ?? emptyExamShell(e.name, e.date, null).kpi,
      classes: raw.classes ?? { labels: [], correct: [], wrong: [], empty: [] },
      subjectGauges: raw.subjectGauges ?? [],
      insight: raw.insight || "",
      priorityInsight: raw.priorityInsight || "",
      priority: raw.priority || [],
      soruSayisi: nQ,
      cevapAnahtari: cevap,
    };
  });

  results.forEach((r) => {
    if (!r?.examId) return;
    const ex = exams[r.examId];
    if (!ex) return;
    const st = stuMap[r.studentId] || {};
    ex.students.push({
      id: r.studentId,
      name: r.name || r.studentName || st.name || r.studentId,
      meta: st.meta || st.sube || r.sube || "",
      net: r.net != null ? Number(r.net) : 0,
      correct: r.correct != null ? Number(r.correct) : 0,
      wrong: r.wrong != null ? Number(r.wrong) : 0,
      blank: r.blank != null ? Number(r.blank) : 0,
      rank: r.rank || "—",
      percentile: r.percentile || "—",
      topics: r.topics,
      radar: r.radar,
      errors: r.errors,
    });
  });

  Object.keys(exams).forEach((eid) => {
    const ex = exams[eid];
    if (!ex.students.length) return;
    const nets = ex.students.map((s) => Number(s.net) || 0);
    const sum = nets.reduce((a, b) => a + b, 0);
    const avg = sum / nets.length;
    const cap = Math.max(1, ex.soruSayisi || 20);
    const max = Math.max(...nets, 0);
    ex.kpi.avgNet = Math.round(avg * 10) / 10;
    ex.kpi.avgMax = Math.max(max, 10, cap);
    ex.kpi.attendance = {
      done: ex.students.length,
      total: Math.max(enrollmentTotal, 1),
    };
  });

  Object.keys(exams).forEach((eid) => buildAggregatesForExam(exams[eid], enrollmentTotal));

  return exams;
}

export function buildAggregatesForExam(ex: TaramaExamShell, enrollmentTotal: number) {
  const stu = ex.students || [];
  const byClass: Record<string, { c: number; w: number; b: number }> = {};
  let totC = 0;
  let totW = 0;
  let totB = 0;
  stu.forEach((s) => {
    const cname = String(s.meta || "Genel").split("·")[0].trim() || "Genel";
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
      correct: keys.map((x) => byClass[x].c),
      wrong: keys.map((x) => byClass[x].w),
      empty: keys.map((x) => byClass[x].b),
    };
  }
  const all = totC + totW + totB;
  const accPct = all ? Math.round((1000 * totC) / all) / 10 : 0;
  const avgN = ex.kpi?.avgNet != null ? Number(ex.kpi.avgNet) : 0;
  const qCap = Math.max(1, Number(ex.soruSayisi) || 20);
  const netBar = Math.max(0, Math.min(100, Math.round((100 * avgN) / qCap)));
  const enroll = Math.max(enrollmentTotal || stu.length, 1);
  const partPct = Math.min(100, Math.round((1000 * stu.length) / enroll) / 10);
  const maxSlots = stu.length * qCap;
  const volPct = maxSlots > 0 ? Math.min(100, Math.round((1000 * all) / maxSlots) / 10) : 0;
  ex.subjectGauges = [
    { name: "Doğruluk (D)", rate: accPct },
    { name: "Ort. Net (ölçek)", rate: netBar },
    { name: "Katılım (%)", rate: partPct },
    { name: "Cevap doluluk (%)", rate: volPct },
  ];
}
