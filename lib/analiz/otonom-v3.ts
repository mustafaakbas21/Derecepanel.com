import type { AnalizExamShell, AnalizStudent, PriorityRow } from "@/lib/analiz/types";
import type { SubjectMasteryRow } from "@/lib/analiz/subject-mastery";

export type OtonomTierId = "kritik" | "dikkat" | "normal";

export type TierCard = {
  id: OtonomTierId;
  label: string;
  desc: string;
  count: number;
};

export const TIER_LABELS: Record<OtonomTierId, string> = {
  kritik: "Kritik",
  dikkat: "Dikkat",
  normal: "Normal",
};

export function getTopicTier(rate: number): OtonomTierId {
  if (rate < 40) return "kritik";
  if (rate < 50) return "dikkat";
  return "normal";
}

export function getMasteryTier(rate: number): OtonomTierId {
  if (rate < 40) return "kritik";
  if (rate < 70) return "dikkat";
  return "normal";
}

function topSubjectByRows(rows: PriorityRow[]): string | null {
  const counts: Record<string, number> = {};
  rows.forEach((r) => {
    counts[r.subjectName] = (counts[r.subjectName] || 0) + 1;
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? null;
}

/** Öncelikli konular (OTONOM) — sınıf doğruluğu %50 altı sorular */
export function buildOtonomTopicTiers(rows: PriorityRow[]): TierCard[] {
  const kritikRows = rows.filter((r) => r.classCorrectRate < 40);
  const dikkatRows = rows.filter(
    (r) => r.classCorrectRate >= 40 && r.classCorrectRate < 50
  );

  const kritikSubject = topSubjectByRows(kritikRows);
  const dikkatSubject = topSubjectByRows(dikkatRows);

  const kritikDesc = kritikRows.length
    ? kritikSubject
      ? `${kritikSubject} · sınıf doğruluğu kritik`
      : "Sınıf doğruluğu %40 altında"
    : "Kritik soru yok";

  const dikkatDesc = dikkatRows.length
    ? dikkatSubject
      ? `${dikkatSubject} · izleme gerekli`
      : "Sınıf doğruluğu %40–50 arası"
    : "Uyarı seviyesinde soru yok";

  return [
    {
      id: "kritik",
      label: TIER_LABELS.kritik,
      desc: kritikDesc,
      count: kritikRows.length,
    },
    {
      id: "dikkat",
      label: TIER_LABELS.dikkat,
      desc: dikkatDesc,
      count: dikkatRows.length,
    },
    {
      id: "normal",
      label: TIER_LABELS.normal,
      desc: "Hedef yolunda",
      count: 0,
    },
  ];
}

/** Sınıf öğrenci triage — net ortalamasına göre */
export function buildStudentTiers(
  students: AnalizStudent[],
  avgNet: number
): TierCard[] {
  if (!students.length) {
    return [
      { id: "kritik", label: TIER_LABELS.kritik, desc: "Veri yok", count: 0 },
      { id: "dikkat", label: TIER_LABELS.dikkat, desc: "Veri yok", count: 0 },
      { id: "normal", label: TIER_LABELS.normal, desc: "Hedef yolunda", count: 0 },
    ];
  }

  const thresholdLow = avgNet * 0.85;
  const kritik = students.filter((s) => s.net < thresholdLow);
  const dikkat = students.filter((s) => s.net >= thresholdLow && s.net < avgNet);
  const normal = students.filter((s) => s.net >= avgNet);

  const weakest = [...students].sort((a, b) => a.net - b.net)[0];

  return [
    {
      id: "kritik",
      label: TIER_LABELS.kritik,
      desc: kritik.length
        ? weakest
          ? `${weakest.name.split(" ")[0] ?? "Öğrenci"} · net düşük`
          : "Net ortalamanın %15 altında"
        : "Kritik öğrenci yok",
      count: kritik.length,
    },
    {
      id: "dikkat",
      label: TIER_LABELS.dikkat,
      desc: dikkat.length ? "Ortalamanın altında, izlenmeli" : "Dikkat grubu boş",
      count: dikkat.length,
    },
    {
      id: "normal",
      label: TIER_LABELS.normal,
      desc: "Hedef yolunda",
      count: normal.length,
    },
  ];
}

/** OTONOM v3 üst şerit: konu + öğrenci birleşik özet */
export function buildOtonomV3Summary(
  priorityRows: PriorityRow[],
  exam: AnalizExamShell | null,
  students: AnalizStudent[]
): TierCard[] {
  const topicTiers = buildOtonomTopicTiers(priorityRows);
  const studentTiers = buildStudentTiers(students, exam?.kpi.avgNet ?? 0);

  const normalTopics =
    exam?.subjectGauges.filter((g) => g.rate >= 50).length ?? 0;

  return [
    topicTiers[0]!,
    topicTiers[1]!,
    {
      id: "normal",
      label: TIER_LABELS.normal,
      desc:
        studentTiers[2]!.count > 0
          ? `${studentTiers[2]!.count} öğrenci · ${normalTopics} ders hedefte`
          : "Hedef yolunda",
      count: studentTiers[2]!.count,
    },
  ];
}

export function buildMasteryTiers(rows: SubjectMasteryRow[]): TierCard[] {
  const kritik = rows.filter((r) => r.rate < 40);
  const dikkat = rows.filter((r) => r.rate >= 40 && r.rate < 70);
  const normal = rows.filter((r) => r.rate >= 70);

  const weakest = [...rows].sort((a, b) => a.rate - b.rate)[0];

  return [
    {
      id: "kritik",
      label: TIER_LABELS.kritik,
      desc: kritik.length
        ? weakest
          ? `${weakest.topicName} · hakimiyet düşük`
          : "Başarı %40 altında"
        : "Kritik konu yok",
      count: kritik.length,
    },
    {
      id: "dikkat",
      label: TIER_LABELS.dikkat,
      desc: dikkat.length ? "Geliştirme alanı" : "Orta seviye konu yok",
      count: dikkat.length,
    },
    {
      id: "normal",
      label: TIER_LABELS.normal,
      desc: "Hedef yolunda",
      count: normal.length,
    },
  ];
}

export function filterPriorityByTier(
  rows: PriorityRow[],
  tier: OtonomTierId | "all"
): PriorityRow[] {
  if (tier === "all") return rows;
  return rows.filter((r) => getTopicTier(r.classCorrectRate) === tier);
}

export function filterMasteryByTier(
  rows: SubjectMasteryRow[],
  tier: OtonomTierId | "all"
): SubjectMasteryRow[] {
  if (tier === "all") return rows;
  return rows.filter((r) => getMasteryTier(r.rate) === tier);
}

export function groupMasteryBySubject(
  rows: SubjectMasteryRow[]
): { subjectName: string; rows: SubjectMasteryRow[]; avgRate: number }[] {
  const map = new Map<string, SubjectMasteryRow[]>();
  rows.forEach((r) => {
    const list = map.get(r.subjectName) || [];
    list.push(r);
    map.set(r.subjectName, list);
  });
  return Array.from(map.entries())
    .map(([subjectName, subjectRows]) => ({
      subjectName,
      rows: subjectRows.sort((a, b) => a.rate - b.rate),
      avgRate: Math.round(
        subjectRows.reduce((s, r) => s + r.rate, 0) / Math.max(subjectRows.length, 1)
      ),
    }))
    .sort((a, b) => a.avgRate - b.avgRate);
}
