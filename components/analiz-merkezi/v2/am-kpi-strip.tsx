"use client";

import type { CSSProperties } from "react";
import { Award, Target, TrendingDown, Users } from "lucide-react";

import type { AnalizExamShell } from "@/lib/analiz/types";
import { rateToHex } from "@/lib/analiz/chart-theme";
import { cn } from "@/lib/utils";

export function AmKpiStrip({
  exam,
  attendPct,
}: {
  exam: AnalizExamShell;
  attendPct: number;
}) {
  const best = exam.subjectGauges[0];
  const weak = exam.subjectGauges.reduce(
    (min, g) => (g.rate < (min?.rate ?? 101) ? g : min),
    exam.subjectGauges[1] ?? exam.subjectGauges[0]
  );
  const netPct = Math.min(100, Math.round((100 * exam.kpi.avgNet) / 120));

  const tiles = [
    {
      icon: Target,
      label: "Sınav ortalaması",
      value: `${exam.kpi.avgNet}`,
      sub: `/ 120 net · ${exam.kpi.attendance.done} katılım`,
      accent: "from-indigo-500 to-violet-600",
      ring: netPct,
    },
    {
      icon: Users,
      label: "Katılım oranı",
      value: `%${attendPct}`,
      sub: `${exam.kpi.attendance.done} / ${exam.kpi.attendance.total} öğrenci`,
      accent: "from-cyan-500 to-blue-600",
      ring: attendPct,
    },
    {
      icon: Award,
      label: "En güçlü alan",
      value: best?.name || "—",
      sub: best ? `%${best.rate} doğruluk` : "Veri yok",
      accent: "from-emerald-500 to-teal-600",
      ring: best?.rate ?? 0,
    },
    {
      icon: TrendingDown,
      label: "Gelişim alanı",
      value: weak?.name || "—",
      sub: weak ? `%${weak.rate} — öncelikli` : "İzleniyor",
      accent: "from-amber-500 to-orange-600",
      ring: weak?.rate ?? 0,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {tiles.map((t) => (
        <div key={t.label} className="am-kpi-tile group">
          <div
            className={cn(
              "am-kpi-tile__icon bg-gradient-to-br shadow-lg",
              t.accent
            )}
          >
            <t.icon className="h-5 w-5 text-white" strokeWidth={2.2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {t.label}
            </p>
            <p className="mt-0.5 truncate text-xl font-bold tracking-tight text-slate-900">
              {t.value}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">{t.sub}</p>
          </div>
          <div
            className="am-kpi-tile__ring shrink-0"
            style={
              {
                "--ring-pct": t.ring,
                "--ring-color": rateToHex(t.ring),
              } as CSSProperties
            }
          >
            <span className="text-[10px] font-bold text-slate-700">{t.ring}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}
