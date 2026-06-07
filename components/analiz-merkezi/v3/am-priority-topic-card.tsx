"use client";

import { AlertTriangle, BookOpen } from "lucide-react";

import { TIER_THEME } from "@/components/analiz-merkezi/v3/tier-theme";
import { Button } from "@/components/ui/button";
import { rateToHex, rateToLightBg } from "@/lib/analiz/chart-theme";
import { getTopicTier } from "@/lib/analiz/otonom-v3";
import type { PriorityRow } from "@/lib/analiz/types";
import { cn } from "@/lib/utils";

export function AmPriorityTopicCard({
  row,
  onSuggestLesson,
}: {
  row: PriorityRow;
  onSuggestLesson: () => void;
}) {
  const tier = getTopicTier(row.classCorrectRate);
  const theme = TIER_THEME[tier];
  const tierLabel = tier === "kritik" ? "Kritik" : "Dikkat";
  const barColor = rateToHex(row.classCorrectRate);

  return (
    <article
      className="am-v3-priority-card group relative overflow-hidden rounded-xl border border-slate-200/90 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-md"
      style={{ borderLeftWidth: 4, borderLeftColor: theme.color }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: theme.bg, color: theme.color }}
          >
            {tier === "kritik" ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <BookOpen className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                style={{ background: theme.bg, color: theme.color }}
              >
                {tierLabel}
              </span>
              <span className="font-mono text-[11px] font-semibold text-slate-400">
                S{row.qNo}
              </span>
            </div>
            <h4 className="mt-1 truncate text-sm font-bold text-slate-900" title={row.topicName}>
              {row.topicName}
            </h4>
            <p className="mt-0.5 text-xs text-slate-500">{row.subjectName}</p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:w-44">
          <div>
            <div className="mb-1 flex items-center justify-between text-[10px] font-semibold text-slate-500">
              <span>Sınıf doğruluğu</span>
              <span style={{ color: barColor }}>%{row.classCorrectRate}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.max(4, row.classCorrectRate)}%`,
                  background: barColor,
                }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-xs font-bold",
                rateToLightBg(row.classCorrectRate)
              )}
            >
              %{row.classCorrectRate}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 shrink-0 text-xs"
              onClick={onSuggestLesson}
            >
              Ek ders
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
