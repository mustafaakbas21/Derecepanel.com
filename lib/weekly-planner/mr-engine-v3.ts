import { decodeKonuCell } from "@/lib/exams/konu-cell";
import { buildKeyStringFromExam, buildStudentAnswers } from "@/lib/exams/exam-evaluate";
import { getExamLayout } from "@/lib/exams/exam-layout";
import { findExamById } from "@/lib/exams/storage/exam-storage";
import { readCoachScopedExamResults } from "@/lib/exams/storage/exam-results-storage";
import type { ExamResultRow, MergedExam } from "@/lib/exams/types";
import { getDersById, getTopicOptions } from "@/lib/mufredat";
import { matchMufredatFromInsightLabel } from "@/lib/weekly-planner/mufredat-match";
import { buildBalancedSuggestionPool } from "@/lib/weekly-planner/mr-suggestion-pool";
import type {
  AiSuggestion,
  ExamInsightsResult,
  ExamSnapshot,
  ExamTopicCell,
  GorevTipi,
  HeatmapSubject,
  MrSummary,
  MrTier,
  SubjectMrSummary,
  TopicDiagnostic,
  TopicTrend,
} from "@/lib/weekly-planner/types";

export const MR_EXAM_WINDOW = 3;
const MAX_HEATMAP_GLOBAL = 14;
const MAX_HEATMAP_SUBJECT = 10;
const MAX_SUBJECT_SUGGESTIONS = 16;

type TopicAgg = { correct: number; wrong: number; total: number };

type TopicRollup = {
  key: string;
  label: string;
  subjectId?: string;
  topicId?: string;
  subjectName?: string;
  topicName?: string;
  perExam: (TopicAgg | null)[];
  correct: number;
  wrong: number;
  total: number;
};

function resolveTopicFromQuestion(
  exam: MergedExam,
  qi: number
): { key: string; label: string; subjectId?: string; topicId?: string; subjectName?: string; topicName?: string } | null {
  const cell = exam.konu?.[qi] || "";
  if (cell) {
    const d = decodeKonuCell(cell);
    const ders = getDersById(d.subjectId);
    const topic = getTopicOptions(d.subjectId).find((t) => t.id === d.topicId);
    if (ders && topic) {
      return {
        key: `${d.subjectId}::${d.topicId}`,
        label: `${ders.dersAdi} — ${topic.label}`,
        subjectId: d.subjectId,
        topicId: d.topicId,
        subjectName: ders.dersAdi,
        topicName: topic.label,
      };
    }
  }

  const yazi = (exam.konuYazi?.[qi] || "").trim();
  if (!yazi) return null;

  const parts = yazi.split("—").map((p) => p.trim()).filter(Boolean);
  const label = parts.length >= 2 ? `${parts[0]} — ${parts[1]}` : yazi;
  const match = matchMufredatFromInsightLabel(label);
  const key = match?.subjectId && match?.topicId ? `${match.subjectId}::${match.topicId}` : slugId(label);

  return {
    key,
    label,
    subjectId: match?.subjectId,
    topicId: match?.topicId,
    subjectName: match?.subjectName,
    topicName: match?.topicName,
  };
}

function examHasMatrix(exam: MergedExam): boolean {
  const n = getExamLayout(exam.sinav).n;
  for (let i = 0; i < n; i++) {
    if ((exam.konuYazi?.[i] || "").trim() || (exam.konu?.[i] || "").trim()) return true;
  }
  return false;
}

function aggregateTopicsForExam(
  exam: MergedExam,
  result: ExamResultRow,
  bucket: Map<string, TopicRollup>
) {
  const layout = getExamLayout(exam.sinav);
  const keyStr = buildKeyStringFromExam(exam, layout.n);
  const ans = buildStudentAnswers(result, layout.n);

  for (let i = 0; i < layout.n; i++) {
    const resolved = resolveTopicFromQuestion(exam, i);
    if (!resolved) continue;

    const k = keyStr.charAt(i);
    const a = ans.charAt(i);
    if (!k || k === " ") continue;

    const entry =
      bucket.get(resolved.key) ??
      ({
        key: resolved.key,
        label: resolved.label,
        subjectId: resolved.subjectId,
        topicId: resolved.topicId,
        subjectName: resolved.subjectName,
        topicName: resolved.topicName,
        perExam: [],
        correct: 0,
        wrong: 0,
        total: 0,
      } satisfies TopicRollup);

    entry.total += 1;
    if (!a || a === " ") entry.wrong += 1;
    else if (a === k) entry.correct += 1;
    else entry.wrong += 1;
    bucket.set(resolved.key, entry);
  }
}

function slugId(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9ğüşıöç]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function scoreOf(agg: TopicAgg | null): number | null {
  if (!agg || agg.total === 0) return null;
  return Math.round((agg.correct / agg.total) * 100);
}

function tierOf(score: number): MrTier {
  if (score < 40) return "kritik";
  if (score < 55) return "dikkat";
  return "normal";
}

export function detectTopicTrend(
  perExam: (TopicAgg | null)[],
  aggregateScore: number
): TopicTrend {
  const scores = perExam.map(scoreOf);
  const indices = scores.map((s, i) => (s != null ? i : -1)).filter((i) => i >= 0);
  if (indices.length === 0) return "stable";

  const newest = scores[0];
  const oldest = scores[indices[indices.length - 1]!];
  if (newest == null || oldest == null) return "stable";

  const appeared = indices.length;
  const allWeak = indices.every((i) => (scores[i] ?? 100) < 45);

  if (appeared >= 2 && allWeak) return "persistent";
  if (appeared >= 2 && oldest - newest >= 15) return "falling";
  if (appeared >= 2 && newest - oldest >= 15) return "recovering";
  if (appeared === 1 && aggregateScore < 45) return "new_weak";
  return "stable";
}

export function priorityScore(
  aggregateScore: number,
  trend: TopicTrend,
  examsAppeared: number,
  wrongCount: number
): number {
  let p = 100 - aggregateScore;
  if (trend === "persistent") p += 28;
  if (trend === "falling") p += 22;
  if (trend === "new_weak") p += 12;
  if (trend === "recovering") p -= 8;
  p += examsAppeared * 6;
  p += Math.min(wrongCount, 24) * 2;
  return Math.round(p);
}

const TREND_LABEL: Record<TopicTrend, string> = {
  persistent: "Sürekli hata",
  falling: "Düşüş trendi",
  new_weak: "Son denemede zayıf",
  recovering: "Toparlanıyor",
  stable: "Stabil",
};

function suggestTitle(
  label: string,
  score: number,
  wrongCount: number
): { title: string; kind: GorevTipi; q?: string } {
  const short = label.includes("—") ? label.split("—").pop()!.trim() : label;
  const q =
    wrongCount >= 8 ? "50" : wrongCount >= 5 ? "40" : wrongCount >= 3 ? "30" : wrongCount >= 2 ? "25" : "20";

  if (score < 35 || wrongCount >= 4) {
    return { title: `${short}: Konu Tekrarı + ${q} Soru`, kind: "konu_calisma", q };
  }
  if (score < 55) {
    return { title: `${short}: Soru Çözümü + ${q} Soru`, kind: "soru_cozme", q };
  }
  return { title: `${short}: Pekiştirme + ${q} Soru`, kind: "soru_cozme", q };
}

function formatExamBreakdown(cells: ExamTopicCell[]): string {
  return cells
    .map((c, i) => {
      const tag = `D${i + 1}`;
      if (c.score == null) return `${tag} —`;
      return `${tag} %${c.score}`;
    })
    .join(" · ");
}

function rollupToDiagnostic(
  t: TopicRollup & { score: number },
  snapshots: ExamSnapshot[]
): TopicDiagnostic {
  const match = matchMufredatFromInsightLabel(t.label);
  const subjectId = t.subjectId ?? match?.subjectId;
  const topicId = t.topicId ?? match?.topicId;
  const subjectName = t.subjectName ?? match?.subjectName;
  const topicName = t.topicName ?? match?.topicName;
  const trend = detectTopicTrend(t.perExam, t.score);
  const tier = tierOf(t.score);
  const examsAppeared = t.perExam.filter((x) => x && x.total > 0).length;

  const perExam: ExamTopicCell[] = snapshots.map((snap, examIndex) => {
    const agg = t.perExam[examIndex];
    return {
      examIndex,
      examName: snap.name,
      score: scoreOf(agg),
      wrong: agg?.wrong ?? 0,
      total: agg?.total ?? 0,
    };
  });

  return {
    label: t.label,
    subjectId,
    topicId,
    subjectName,
    topicName,
    aggregateScore: t.score,
    wrongCount: t.wrong,
    totalCount: t.total,
    examsAppeared,
    trend,
    tier,
    priority: priorityScore(t.score, trend, examsAppeared, t.wrong),
    perExam,
  };
}

function diagnosticToHeatmap(d: TopicDiagnostic): HeatmapSubject {
  return {
    id: d.subjectId && d.topicId ? `${d.subjectId}::${d.topicId}` : slugId(d.label),
    label: d.label,
    score: d.aggregateScore,
    wrongCount: d.wrongCount,
    totalCount: d.totalCount,
    subjectId: d.subjectId,
    topicId: d.topicId,
    topicName: d.topicName,
    trend: d.trend,
    tier: d.tier,
    examsAppeared: d.examsAppeared,
    perExamScores: d.perExam.map((c) => c.score),
  };
}

export function diagnosticToSuggestion(d: TopicDiagnostic, examCount: number): AiSuggestion {
  const { title, kind, q } = suggestTitle(d.label, d.aggregateScore, d.wrongCount);
  const duration =
    kind === "konu_calisma"
      ? String(Math.min(70, 35 + d.wrongCount * 5))
      : String(Math.min(60, 30 + d.wrongCount * 4));
  const priority =
    d.tier === "kritik" ||
    d.trend === "persistent" ||
    d.trend === "falling" ||
    d.wrongCount >= 3
      ? "high"
      : "routine";

  const examBreakdown = formatExamBreakdown(d.perExam);
  const shortLabel = d.topicName || (d.label.includes("—") ? d.label.split("—").pop()!.trim() : d.label);

  return {
    id: d.subjectId && d.topicId ? `${d.subjectId}::${d.topicId}` : slugId(d.label),
    title,
    subtitle: `Son ${examCount} deneme · ${d.subjectName ?? "Ders"} · ${shortLabel} · %${d.aggregateScore} · ${d.wrongCount} hatalı soru · ${TREND_LABEL[d.trend]}`,
    priority,
    topicKey: d.label,
    taskKind: kind,
    targetQuestions: q,
    subjectId: d.subjectId,
    topicId: d.topicId,
    subjectName: d.subjectName,
    topicName: d.topicName,
    score: d.aggregateScore,
    wrongCount: d.wrongCount,
    totalCount: d.totalCount,
    suggestedDurationMin: duration,
    coachNote: [
      `MR otonom · ${d.subjectName ?? ""} · ${d.label}`,
      `${d.wrongCount} hatalı / ${d.totalCount} soru (%${d.aggregateScore})`,
      TREND_LABEL[d.trend],
      examBreakdown,
      title,
    ]
      .filter(Boolean)
      .join(" · "),
    trend: d.trend,
    tier: d.tier,
    examsAppeared: d.examsAppeared,
    examBreakdown,
  };
}

/** En az bir hatalı/boş cevaplı konu */
function hasWrongAnswers(t: TopicRollup & { score: number }): boolean {
  return t.wrong >= 1;
}

function buildSubjectSummaries(
  diagnostics: TopicDiagnostic[],
  suggestions: AiSuggestion[]
): SubjectMrSummary[] {
  const map = new Map<string, SubjectMrSummary>();

  diagnostics.filter((d) => d.wrongCount >= 1 && d.subjectId).forEach((d) => {
    const sid = d.subjectId!;
    const prev = map.get(sid);
    const worst =
      prev?.worstScore == null
        ? d.aggregateScore
        : Math.min(prev.worstScore, d.aggregateScore);
    map.set(sid, {
      subjectId: sid,
      subjectName: d.subjectName ?? sid,
      wrongQuestions: (prev?.wrongQuestions ?? 0) + d.wrongCount,
      topicCount: (prev?.topicCount ?? 0) + 1,
      worstScore: worst,
      suggestionCount: 0,
    });
  });

  suggestions.forEach((s) => {
    if (!s.subjectId) return;
    const row = map.get(s.subjectId);
    if (row) row.suggestionCount += 1;
  });

  return [...map.values()].sort((a, b) => b.wrongQuestions - a.wrongQuestions);
}

export function filterInsightsBySubject(
  insights: ExamInsightsResult,
  subjectId: string
): {
  heatmap: HeatmapSubject[];
  suggestions: AiSuggestion[];
  criticalTopic: string | null;
  subjectEmptyHint: string | null;
} {
  if (!subjectId) {
    return {
      heatmap: insights.heatmap,
      suggestions: insights.suggestions,
      criticalTopic: insights.criticalTopic,
      subjectEmptyHint: null,
    };
  }

  const diagnostics = insights.topicDiagnostics.filter(
    (d) => d.subjectId === subjectId && d.wrongCount >= 1
  );

  if (diagnostics.length === 0) {
    return {
      heatmap: [],
      suggestions: [],
      criticalTopic: null,
      subjectEmptyHint:
        "Son 3 denemede bu derste hatalı soru kaydı yok. Başka ders seçin veya deneme matrisini kontrol edin.",
    };
  }

  const sorted = [...diagnostics].sort((a, b) => b.priority - a.priority);
  const heatmap = sorted.slice(0, MAX_HEATMAP_SUBJECT).map(diagnosticToHeatmap);
  const suggestions = sorted
    .slice(0, MAX_SUBJECT_SUGGESTIONS)
    .map((d) => diagnosticToSuggestion(d, insights.examCount));

  return {
    heatmap,
    suggestions,
    criticalTopic: sorted[0]?.label ?? null,
    subjectEmptyHint: null,
  };
}

const emptySummary = (): MrSummary => ({
  persistentCount: 0,
  fallingCount: 0,
  kritikCount: 0,
  topicsWithWrongs: 0,
  totalWrongQuestions: 0,
  subjectsWithSuggestions: 0,
});

export function buildMrEngineV3(studentId: string): ExamInsightsResult {
  const empty: ExamInsightsResult = {
    heatmap: [],
    suggestions: [],
    topicDiagnostics: [],
    subjectSummaries: [],
    criticalTopic: null,
    examCount: 0,
    examSnapshots: [],
    latestExamName: null,
    latestExamDate: null,
    emptyReason: null,
    summary: emptySummary(),
  };

  if (!studentId) {
    return {
      ...empty,
      emptyReason: "Öğrenci seçin; son 3 denemedeki tüm hatalı sorular analiz edilir.",
    };
  }

  const allResults = readCoachScopedExamResults().filter(
    (r) => String(r.studentId) === String(studentId)
  );

  if (allResults.length === 0) {
    return {
      ...empty,
      emptyReason:
        "Bu öğrenci için kayıtlı deneme sonucu yok. Sonuç Yükleme veya Denemeler üzerinden sonuç ekleyin.",
    };
  }

  const byExam = new Map<string, ExamResultRow>();
  for (const r of allResults) {
    const prev = byExam.get(r.examId);
    if (!prev || String(r.savedAt) > String(prev.savedAt)) byExam.set(r.examId, r);
  }

  const sorted = [...byExam.values()].sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
  );

  const examsWithMatrix: { exam: MergedExam; result: ExamResultRow }[] = [];
  for (const result of sorted) {
    const exam = findExamById(result.examId);
    if (!exam || !examHasMatrix(exam)) continue;
    examsWithMatrix.push({ exam, result });
    if (examsWithMatrix.length >= MR_EXAM_WINDOW) break;
  }

  if (examsWithMatrix.length === 0) {
    const latest = sorted[0];
    const ex = findExamById(latest.examId);
    return {
      ...empty,
      latestExamName: ex?.ad || latest.examName || null,
      latestExamDate: latest.savedAt,
      emptyReason:
        "Son denemelerde konu matrisi yok. Kurumsal denemede cevap anahtarı + konu matrisi doldurulunca MR teşhisi açılır.",
    };
  }

  const examSnapshots: ExamSnapshot[] = examsWithMatrix.map(({ exam, result }) => ({
    examId: exam.id,
    name: exam.ad || result.examName || "Deneme",
    dateISO: result.savedAt,
  }));

  const labelMap = new Map<string, TopicRollup>();

  examsWithMatrix.forEach(({ exam, result }, examIndex) => {
    const bucket = new Map<string, TopicRollup>();
    aggregateTopicsForExam(exam, result, bucket);
    bucket.forEach((agg, key) => {
      const prev = labelMap.get(key) ?? {
        ...agg,
        perExam: Array.from({ length: examsWithMatrix.length }, () => null),
        correct: 0,
        wrong: 0,
        total: 0,
      };
      prev.perExam[examIndex] = {
        correct: agg.correct,
        wrong: agg.wrong,
        total: agg.total,
      };
      prev.correct += agg.correct;
      prev.wrong += agg.wrong;
      prev.total += agg.total;
      labelMap.set(key, prev);
    });
  });

  const rollups = [...labelMap.values()]
    .map((t) => ({
      ...t,
      score: t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0,
    }))
    .filter(hasWrongAnswers)
    .sort((a, b) => {
      if (a.wrong !== b.wrong) return b.wrong - a.wrong;
      return a.score - b.score;
    });

  if (rollups.length === 0) {
    const latest = examsWithMatrix[0];
    return {
      ...empty,
      examCount: examsWithMatrix.length,
      examSnapshots,
      latestExamName: latest.exam.ad,
      latestExamDate: latest.result.savedAt,
      emptyReason: "Son denemelerde hatalı/boş cevaplı etiketli soru bulunamadı.",
    };
  }

  const topicDiagnostics = rollups
    .map((t) => rollupToDiagnostic(t, examSnapshots))
    .sort((a, b) => b.priority - a.priority);

  const totalWrongQuestions = topicDiagnostics.reduce((s, d) => s + d.wrongCount, 0);

  const summary: MrSummary = {
    persistentCount: topicDiagnostics.filter((d) => d.trend === "persistent").length,
    fallingCount: topicDiagnostics.filter((d) => d.trend === "falling").length,
    kritikCount: topicDiagnostics.filter((d) => d.tier === "kritik").length,
    topicsWithWrongs: topicDiagnostics.length,
    totalWrongQuestions,
    subjectsWithSuggestions: 0,
  };

  const suggestions = buildBalancedSuggestionPool(
    topicDiagnostics,
    examsWithMatrix.length,
    diagnosticToSuggestion
  );

  summary.subjectsWithSuggestions = new Set(
    suggestions.map((s) => s.subjectId).filter(Boolean)
  ).size;

  const subjectSummaries = buildSubjectSummaries(topicDiagnostics, suggestions);

  const heatmap = topicDiagnostics.slice(0, MAX_HEATMAP_GLOBAL).map(diagnosticToHeatmap);

  const latest = examsWithMatrix[0];

  return {
    heatmap,
    suggestions,
    topicDiagnostics,
    subjectSummaries,
    criticalTopic: topicDiagnostics[0]?.label ?? null,
    examCount: examsWithMatrix.length,
    examSnapshots,
    latestExamName: latest.exam.ad,
    latestExamDate: latest.result.savedAt,
    emptyReason: null,
    summary,
  };
}
