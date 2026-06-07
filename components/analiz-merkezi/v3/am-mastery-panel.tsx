"use client";

import { useEffect, useMemo, useState } from "react";
import { Layers } from "lucide-react";

import { CrossRadarChart } from "@/components/analiz-merkezi/charts/cross-radar-chart";
import { CrossSubjectsBarChart } from "@/components/analiz-merkezi/charts/cross-subjects-bar-chart";
import { ChartCard } from "@/components/analiz-merkezi/charts/chart-shell";
import {
  MasteryTrendBadge,
  MasteryTrendLegend,
} from "@/components/analiz-merkezi/v3/mastery-trend-badge";
import { MasteryTopicStatsPanel } from "@/components/analiz-merkezi/v3/mastery-topic-stats-panel";
import { rateToLightBg } from "@/lib/analiz/chart-theme";
import { sinavScopeLabel } from "@/lib/analiz/mastery-scope";
import {
  countByTrendStatus,
  groupTrendsBySubject,
  TREND_STATUS_SORT,
} from "@/lib/analiz/mastery-trend-engine";
import type { TopicTrendAnalysis, TrendStatus } from "@/lib/analiz/mastery-trend-types";
import type { SubjectMasteryRow } from "@/lib/analiz/subject-mastery";
import type { SinavTipi } from "@/lib/exams/types";
import { cn } from "@/lib/utils";

const TREND_DOT: Record<TrendStatus, string> = {
  CRITICAL_DROP: "#e11d48",
  CHRONIC_WEAK: "#f59e0b",
  RISING: "#10b981",
  STABLE_HIGH: "#0ea5e9",
  INSUFFICIENT_DATA: "#94a3b8",
};

const TREND_FILTER_CHIPS: { id: TrendStatus | "all"; label: string }[] = [
  { id: "all", label: "Tümü" },
  { id: "CRITICAL_DROP", label: "Kritik düşüş" },
  { id: "CHRONIC_WEAK", label: "Kronik eksik" },
  { id: "RISING", label: "Yükseliş" },
  { id: "STABLE_HIGH", label: "İstikrarlı" },
  { id: "INSUFFICIENT_DATA", label: "Veri yetersiz" },
];

function worstTrendInGroup(rows: TopicTrendAnalysis[]): TrendStatus {
  let best: TrendStatus = "INSUFFICIENT_DATA";
  for (const r of rows) {
    if (TREND_STATUS_SORT[r.trendStatus] < TREND_STATUS_SORT[best]) {
      best = r.trendStatus;
    }
  }
  return best;
}

export function AmMasteryPanel({
  studentId,
  studentName,
  sinavScope,
  examScopeName,
  crossSummary,
  crossMastery,
  topicTrends,
  crossSubjectBarData,
  emptyMessage,
}: {
  studentId: string;
  studentName: string;
  sinavScope?: SinavTipi | null;
  examScopeName?: string;
  crossSummary: {
    examCount: number;
    correct: number;
    wrong: number;
    empty: number;
    avgRate: number;
  };
  crossMastery: SubjectMasteryRow[];
  topicTrends: TopicTrendAnalysis[];
  crossSubjectBarData: { name: string; rate: number }[];
  emptyMessage?: string;
}) {
  const [trendFilter, setTrendFilter] = useState<TrendStatus | "all">("all");
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  const trendCounts = useMemo(() => countByTrendStatus(topicTrends), [topicTrends]);

  const filteredTrends = useMemo(() => {
    if (trendFilter === "all") return topicTrends;
    return topicTrends.filter((r) => r.trendStatus === trendFilter);
  }, [topicTrends, trendFilter]);

  const grouped = useMemo(() => groupTrendsBySubject(filteredTrends), [filteredTrends]);

  useEffect(() => {
    if (!grouped.length) {
      setExpandedSubject(null);
      return;
    }
    const stillVisible = grouped.some((g) => g.subjectName === expandedSubject);
    if (!stillVisible) setExpandedSubject(grouped[0]!.subjectName);
  }, [grouped, expandedSubject]);

  if (!crossMastery.length && !topicTrends.length) {
    return (
      <div
        id="am-cross-empty"
        className="am-card grid min-h-[200px] place-items-center p-8 text-center text-slate-600"
      >
        {emptyMessage ||
          "Matrix sonucu yok — önce sonuç yükleyin ve takvimde konu matrisini doldurun."}
      </div>
    );
  }

  return (
    <div id="am-cross-top" className="am-v3-mastery space-y-5">
      <div className="am-v3-mastery-hero am-card p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="am-v3-pill am-v3-pill--slate mb-2 inline-flex items-center gap-1.5">
              <Layers className="h-3 w-3" />
              Konu Hakimiyeti v3
            </span>
            <h3 className="text-lg font-bold text-slate-900">
              Zaman serisi analizi ·{" "}
              <span id="am-cross-student" className="text-slate-700">
                {studentName}
              </span>
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              <strong id="am-cross-exam-count">{crossSummary.examCount}</strong>{" "}
              {sinavScope ? (
                <>
                  <strong>{sinavScopeLabel(sinavScope)}</strong> deneme · hareketli ortalama &
                  gürültü filtresi
                </>
              ) : (
                <>deneme · istatistiksel trend</>
              )}
              {examScopeName ? (
                <span className="mt-1 block text-[11px] font-normal text-slate-500">
                  Referans deneme: {examScopeName}
                </span>
              ) : null}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span
              id="am-cross-correct"
              className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700"
            >
              {crossSummary.correct} doğru
            </span>
            <span
              id="am-cross-wrong"
              className="rounded-full bg-rose-50 px-2.5 py-1 text-rose-700"
            >
              {crossSummary.wrong} yanlış
            </span>
            <span
              id="am-cross-empty"
              className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700"
            >
              {crossSummary.empty} boş
            </span>
            <span
              id="am-cross-rate"
              className="rounded-full bg-slate-900 px-2.5 py-1 text-white"
            >
              Ort. %{crossSummary.avgRate}
            </span>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-1.5">
          {TREND_FILTER_CHIPS.map((chip) => {
            const count =
              chip.id === "all"
                ? topicTrends.length
                : trendCounts[chip.id as TrendStatus] ?? 0;
            return (
              <button
                key={chip.id}
                type="button"
                className={cn(
                  "am-filter-chip",
                  trendFilter === chip.id && "am-filter-chip--active"
                )}
                onClick={() => setTrendFilter(chip.id)}
              >
                {chip.label}
                <span className="ml-1 opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
        <MasteryTrendLegend />
        <p className="mt-2 text-[11px] text-slate-400">
          Geçmişte konu başına 3 sorudan az veri varsa istatistiksel trend üretilmez (gri).
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Konu radarı"
          subtitle={
            sinavScope
              ? `Tüm ${sinavScopeLabel(sinavScope)} denemeleri — en zayıf 8 konu`
              : "En zayıf 8 konu"
          }
        >
          <CrossRadarChart data={crossMastery.slice(0, 8)} />
        </ChartCard>
        <ChartCard
          title="Ders başarı sıralaması"
          subtitle={
            sinavScope
              ? `${sinavScopeLabel(sinavScope)} — kümülatif doğruluk`
              : "Kümülatif doğruluk"
          }
        >
          <CrossSubjectsBarChart data={crossSubjectBarData} />
        </ChartCard>
      </div>

      <div className="am-card overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-bold text-slate-900">Konu detay listesi</p>
          <p className="text-xs text-slate-500">
            Öncelik: kritik düşüş → kronik eksik → yükseliş · rozet üzerine gelince kanıt
          </p>
        </div>

        {grouped.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-500">
            Bu trend filtresinde konu yok.
          </p>
        ) : (
          <div id="am-mastery-groups" className="divide-y divide-slate-100">
            {grouped.map((g) => {
              const open = expandedSubject === g.subjectName;
              const worst = worstTrendInGroup(g.rows);
              return (
                <div key={g.subjectName}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                    onClick={() =>
                      setExpandedSubject(open ? null : g.subjectName)
                    }
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: TREND_DOT[worst] }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900">{g.subjectName}</p>
                      <p className="text-xs text-slate-500">
                        {g.rows.length} konu · ort. %{g.avgRate}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-xs font-bold",
                        rateToLightBg(g.avgRate)
                      )}
                    >
                      %{g.avgRate}
                    </span>
                  </button>
                  {open && (
                    <ul className="border-t border-slate-50 bg-slate-50/50">
                      {g.rows.map((r) => (
                        <li
                          key={r.topicKey}
                          className="flex flex-col gap-2 border-b border-slate-100/80 px-4 py-2.5 last:border-0 sm:flex-row sm:items-center sm:gap-3 sm:px-6"
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                            <MasteryTrendBadge
                              status={r.trendStatus}
                              kanitMetni={r.kanitMetni}
                            />
                            <span className="min-w-0 text-sm font-medium text-slate-800">
                              {r.konuAdi}
                            </span>
                          </div>
                          <MasteryTopicStatsPanel
                            currentStats={r.currentStats}
                            historicalStats={r.historicalStats}
                            className="w-full sm:w-auto"
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
