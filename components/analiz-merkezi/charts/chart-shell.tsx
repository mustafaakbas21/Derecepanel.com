"use client";

import type { ReactNode } from "react";

import { AM_GRADIENT_IDS, AM_CHART } from "@/lib/analiz/chart-theme";
import { cn } from "@/lib/utils";

/** SVG gradient tanımları — Recharts içinde url(#id) ile kullanılır */
export function ChartGradientDefs() {
  return (
    <defs>
      <linearGradient id={AM_GRADIENT_IDS.barPrimary} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#818cf8" />
        <stop offset="100%" stopColor="#4f46e5" />
      </linearGradient>
      <linearGradient id={AM_GRADIENT_IDS.barEmerald} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
      <linearGradient id={AM_GRADIENT_IDS.barRose} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fb7185" />
        <stop offset="100%" stopColor="#e11d48" />
      </linearGradient>
      <linearGradient id={AM_GRADIENT_IDS.areaTrend} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#818cf8" stopOpacity={0.35} />
        <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.02} />
      </linearGradient>
      <linearGradient id={AM_GRADIENT_IDS.donut} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#6366f1" />
        <stop offset="50%" stopColor="#8b5cf6" />
        <stop offset="100%" stopColor="#06b6d4" />
      </linearGradient>
    </defs>
  );
}

type TooltipPayload = { name?: string; value?: number; color?: string; dataKey?: string };

export function AmChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  formatter?: (value: number, name: string) => [string, string];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200/90 bg-white/95 px-3 py-2.5 shadow-lg backdrop-blur-sm">
      {label && (
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </p>
      )}
      <ul className="space-y-1">
        {payload.map((p, i) => {
          const v = Number(p.value ?? 0);
          const [display, series] = formatter
            ? formatter(v, String(p.name ?? p.dataKey ?? ""))
            : [String(v), String(p.name ?? p.dataKey ?? "")];
          return (
            <li key={i} className="flex items-center gap-2 text-sm">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: p.color || AM_CHART.indigo }}
              />
              <span className="text-slate-600">{series}</span>
              <span className="ml-auto font-bold text-slate-900">{display}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ChartCard({
  title,
  subtitle,
  children,
  className,
  action,
  id,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
  id?: string;
}) {
  return (
    <div id={id} className={cn("am-chart-card", className)}>
      <div className="am-chart-card__head">
        <div>
          <h3 className="am-chart-card__title">{title}</h3>
          {subtitle && <p className="am-chart-card__sub">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="am-chart-card__body min-w-0 overflow-x-auto">{children}</div>
    </div>
  );
}
