"use client";

import type {
  TopicCurrentStats,
  TopicHistoricalStats,
} from "@/lib/analiz/mastery-trend-types";
import { cn } from "@/lib/utils";

function formatPct(yuzde: number): string {
  const n = Number.isFinite(yuzde) ? yuzde : 0;
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function MasteryTopicStatsPanel({
  currentStats,
  historicalStats,
  className,
}: {
  currentStats: TopicCurrentStats;
  historicalStats: TopicHistoricalStats;
  className?: string;
}) {
  const { dogru, yanlis, bos, yuzde } = currentStats;
  const hasHistorical = historicalStats.toplamSoru > 0;

  return (
    <div
      className={cn(
        "flex shrink-0 flex-wrap items-center justify-end gap-3 text-sm sm:gap-4",
        className
      )}
    >
      <div className="flex items-center gap-2 text-slate-700 sm:gap-3">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
          Bu Sınav:
        </span>
        <span className="font-mono text-xs text-slate-600 sm:text-sm">
          {dogru}D · {yanlis}Y · {bos}B
        </span>
        <span className="w-12 text-right text-xs font-bold text-slate-900 sm:text-sm">
          %{formatPct(yuzde)}
        </span>
      </div>

      <div className="hidden h-5 w-px bg-slate-200 sm:block" aria-hidden />

      <div className="flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
          Geçmiş:
        </span>
        {hasHistorical ? (
          <span className="text-xs text-slate-500">
            <strong className="text-slate-700">
              {historicalStats.toplamSoru} Soru
            </strong>{" "}
            ({historicalStats.toplamDogru}D · {historicalStats.toplamYanlis}Y ·{" "}
            {historicalStats.toplamBos}B)
          </span>
        ) : (
          <span className="text-xs italic text-slate-400">Veri Yok</span>
        )}
      </div>
    </div>
  );
}
