"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  HelpCircle,
  Sparkles,
  TrendingDown,
} from "lucide-react";

import type { TrendStatus } from "@/lib/analiz/mastery-trend-types";
import { cn } from "@/lib/utils";

const CONFIG: Record<
  TrendStatus,
  {
    label: string;
    short: string;
    className: string;
    Icon: typeof AlertTriangle;
  }
> = {
  CRITICAL_DROP: {
    label: "Kritik düşüş",
    short: "Kritik düşüş",
    className: "border-rose-200 bg-rose-50 text-rose-800",
    Icon: TrendingDown,
  },
  CHRONIC_WEAK: {
    label: "Kronik eksik",
    short: "Kronik eksik",
    className: "border-amber-200 bg-amber-50 text-amber-900",
    Icon: AlertTriangle,
  },
  STABLE_HIGH: {
    label: "Kusursuz / istikrarlı",
    short: "İstikrarlı",
    className: "border-sky-200 bg-sky-50 text-sky-900",
    Icon: Sparkles,
  },
  RISING: {
    label: "Yükselişte",
    short: "Yükseliş",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    Icon: ArrowUpRight,
  },
  INSUFFICIENT_DATA: {
    label: "Veri yetersiz",
    short: "Veri yetersiz",
    className: "border-slate-200 bg-slate-100 text-slate-600",
    Icon: HelpCircle,
  },
};

export function MasteryTrendBadge({
  status,
  kanitMetni,
  compact = false,
}: {
  status: TrendStatus;
  kanitMetni: string;
  compact?: boolean;
}) {
  const cfg = CONFIG[status];
  const Icon = cfg.Icon;
  return (
    <span
      className={cn(
        "group relative inline-flex cursor-default items-center gap-1 rounded-full border font-bold",
        cfg.className,
        compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[10px]"
      )}
      title={kanitMetni}
    >
      <Icon className={compact ? "h-3 w-3 shrink-0" : "h-3.5 w-3.5 shrink-0"} aria-hidden />
      <span className="uppercase tracking-wide">{cfg.short}</span>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 hidden w-max max-w-[220px] -translate-x-1/2 rounded-lg border border-slate-200 bg-slate-900 px-2.5 py-1.5 text-[10px] font-medium normal-case tracking-normal text-white shadow-lg group-hover:block"
      >
        {kanitMetni}
      </span>
    </span>
  );
}

export function MasteryTrendLegend() {
  return (
    <div className="flex flex-wrap gap-2 text-[10px] font-semibold text-slate-600">
      {(Object.keys(CONFIG) as TrendStatus[]).map((key) => {
        const cfg = CONFIG[key];
        const Icon = cfg.Icon;
        return (
          <span
            key={key}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5",
              cfg.className
            )}
          >
            <Icon className="h-3 w-3" aria-hidden />
            {cfg.label}
          </span>
        );
      })}
    </div>
  );
}
