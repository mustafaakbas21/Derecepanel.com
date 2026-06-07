import { collectTopicStatsForExam } from "@/lib/analiz/mastery-trend-per-exam";
import type {
  ExamTimelineEntry,
  ExamType,
  TopicTrendAnalysis,
  TrendStatus,
} from "@/lib/analiz/mastery-trend-types";
import { examMatchesSinavScope } from "@/lib/analiz/mastery-scope";
import { readAnalizExamResults } from "@/lib/analiz/exam-results-source";
import { loadMergedExams } from "@/lib/exams/exam-storage";
import type { SinavTipi } from "@/lib/exams/types";

const MIN_HISTORICAL_QUESTIONS = 3;

export const TREND_STATUS_SORT: Record<TrendStatus, number> = {
  CRITICAL_DROP: 0,
  CHRONIC_WEAK: 1,
  RISING: 2,
  STABLE_HIGH: 3,
  INSUFFICIENT_DATA: 4,
};

export function sinavToExamType(sinav: SinavTipi | null | undefined): ExamType | null {
  if (sinav === "TYT" || sinav === "AYT" || sinav === "YDT") return sinav;
  return null;
}

/** Öğrencinin aynı sınav tipindeki denemeleri (kronolojik, eski → yeni) */
export function buildStudentExamTimeline(
  studentId: string,
  examType: ExamType
): ExamTimelineEntry[] {
  const sid = String(studentId || "").trim();
  if (!sid) return [];

  const results = readAnalizExamResults().filter(
    (r) =>
      r?.examId &&
      (String(r.studentId) === sid || String(r.studentCode) === sid) &&
      examMatchesSinavScope(String(r.examId), examType)
  );

  const examIds = new Set(results.map((r) => String(r.examId)));
  const merged = loadMergedExams().filter(
    (e) => e?.id && examIds.has(e.id) && e.sinav === examType
  );

  return merged
    .map((e) => ({
      examId: e.id,
      examName: e.ad || e.id,
      examDate: e.tarih || "",
      examType,
    }))
    .sort((a, b) => {
      const da = Date.parse(a.examDate) || 0;
      const db = Date.parse(b.examDate) || 0;
      if (da !== db) return da - db;
      return a.examId.localeCompare(b.examId);
    });
}

export function classifyTopicTrend(
  gecmisOrtalama: number,
  simdikiBasari: number,
  gecmisSoruSayisi: number
): TrendStatus {
  if (gecmisSoruSayisi < MIN_HISTORICAL_QUESTIONS) {
    return "INSUFFICIENT_DATA";
  }
  if (gecmisOrtalama >= 60 && simdikiBasari < 35) {
    return "CRITICAL_DROP";
  }
  if (gecmisOrtalama < 35 && simdikiBasari < 35) {
    return "CHRONIC_WEAK";
  }
  if (gecmisOrtalama >= 80 && simdikiBasari >= 80) {
    return "STABLE_HIGH";
  }
  if (gecmisOrtalama < 50 && simdikiBasari >= 70) {
    return "RISING";
  }
  return "INSUFFICIENT_DATA";
}

export function buildKanitMetni(
  gecmisOrtalama: number,
  simdikiBasari: number,
  gecmisSoruSayisi: number
): string {
  if (gecmisSoruSayisi < MIN_HISTORICAL_QUESTIONS) {
    return `Geçmişte bu konuda yalnızca ${gecmisSoruSayisi} soru (min. ${MIN_HISTORICAL_QUESTIONS} gerekli)`;
  }
  return `Geçmiş ortalama: %${gecmisOrtalama} → Son deneme: %${simdikiBasari}`;
}

export type AnalyzeMasteryTrendsInput = {
  studentId: string;
  currentExamId: string;
  currentExamType: ExamType;
  currentExamDate: string;
};

/**
 * Zaman serisi + hareketli ortalama — yalnızca seçili tip (TYT/AYT/YDT) ve
 * şu anki denemeden önceki geçmiş.
 */
export function analyzeMasteryTrends(input: AnalyzeMasteryTrendsInput): TopicTrendAnalysis[] {
  const sid = String(input.studentId || "").trim();
  const currentId = String(input.currentExamId || "").trim();
  const examType = input.currentExamType;
  if (!sid || !currentId) return [];

  const timeline = buildStudentExamTimeline(sid, examType);
  const currentDate = input.currentExamDate || timeline.find((e) => e.examId === currentId)?.examDate || "";

  const pastExams = timeline.filter((e) => {
    if (e.examId === currentId) return false;
    const ed = Date.parse(e.examDate) || 0;
    const cd = Date.parse(currentDate) || 0;
    if (cd && ed) return ed < cd;
    return e.examId !== currentId;
  });

  const statsByExam = new Map<string, Map<string, import("@/lib/analiz/mastery-trend-types").TopicStat>>();
  for (const exam of timeline) {
    statsByExam.set(exam.examId, collectTopicStatsForExam(sid, exam.examId));
  }

  const currentMap = statsByExam.get(currentId) ?? collectTopicStatsForExam(sid, currentId);
  if (!currentMap.size) return [];

  const out: TopicTrendAnalysis[] = [];

  currentMap.forEach((current) => {
    let histDogru = 0;
    let histYanlis = 0;
    let histBos = 0;

    pastExams.forEach((exam) => {
      const past = statsByExam.get(exam.examId)?.get(current.topicKey);
      if (!past) return;
      histDogru += past.dogru;
      histYanlis += past.yanlis;
      histBos += past.bos;
    });

    const gecmisSoruSayisi = histDogru + histYanlis + histBos;
    const gecmisOrtalama =
      gecmisSoruSayisi > 0 ? Math.round((1000 * histDogru) / gecmisSoruSayisi) / 10 : 0;
    const simdikiBasari = current.basariYuzdesi;

    const trendStatus = classifyTopicTrend(gecmisOrtalama, simdikiBasari, gecmisSoruSayisi);

    out.push({
      ...current,
      trendStatus,
      gecmisOrtalama,
      simdikiBasari,
      gecmisSoruSayisi,
      kanitMetni: buildKanitMetni(gecmisOrtalama, simdikiBasari, gecmisSoruSayisi),
      currentStats: {
        dogru: current.dogru,
        yanlis: current.yanlis,
        bos: current.bos,
        yuzde: simdikiBasari,
      },
      historicalStats: {
        toplamSoru: gecmisSoruSayisi,
        toplamDogru: histDogru,
        toplamYanlis: histYanlis,
        toplamBos: histBos,
      },
    });
  });

  out.sort((a, b) => {
    const pa = TREND_STATUS_SORT[a.trendStatus];
    const pb = TREND_STATUS_SORT[b.trendStatus];
    if (pa !== pb) return pa - pb;
    if (a.trendStatus === "CRITICAL_DROP" || a.trendStatus === "CHRONIC_WEAK") {
      return a.simdikiBasari - b.simdikiBasari;
    }
    return b.simdikiBasari - a.simdikiBasari;
  });

  return out;
}

export function countByTrendStatus(rows: TopicTrendAnalysis[]): Record<TrendStatus, number> {
  const init: Record<TrendStatus, number> = {
    CRITICAL_DROP: 0,
    CHRONIC_WEAK: 0,
    STABLE_HIGH: 0,
    RISING: 0,
    INSUFFICIENT_DATA: 0,
  };
  rows.forEach((r) => {
    init[r.trendStatus]++;
  });
  return init;
}

export function groupTrendsBySubject(
  rows: TopicTrendAnalysis[]
): { subjectName: string; rows: TopicTrendAnalysis[]; avgRate: number }[] {
  const map = new Map<string, TopicTrendAnalysis[]>();
  rows.forEach((r) => {
    const list = map.get(r.dersAdi) || [];
    list.push(r);
    map.set(r.dersAdi, list);
  });

  return Array.from(map.entries())
    .map(([subjectName, subjectRows]) => {
      const total = subjectRows.reduce((s, r) => s + r.dogru + r.yanlis + r.bos, 0);
      const correct = subjectRows.reduce((s, r) => s + r.dogru, 0);
      const avgRate = total ? Math.round((1000 * correct) / total) / 10 : 0;
      return {
        subjectName,
        rows: subjectRows.sort(
          (a, b) => TREND_STATUS_SORT[a.trendStatus] - TREND_STATUS_SORT[b.trendStatus]
        ),
        avgRate,
      };
    })
    .sort((a, b) => {
      const aMin = Math.min(...a.rows.map((r) => TREND_STATUS_SORT[r.trendStatus]));
      const bMin = Math.min(...b.rows.map((r) => TREND_STATUS_SORT[r.trendStatus]));
      if (aMin !== bMin) return aMin - bMin;
      return a.avgRate - b.avgRate;
    });
}
