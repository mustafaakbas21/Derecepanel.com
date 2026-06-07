"use client";

import { useMemo } from "react";
import {
  AlertTriangle,
  BarChart3,
  ListChecks,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Skeleton } from "@/components/ui/skeleton";
import {
  analyticsTrendChartLabel,
  computeTrendDelta,
} from "@/lib/onyx/analytics-normalize";
import type { AnalyticsSkillData } from "@/lib/onyx/skill-types";
import { cn } from "@/lib/utils";

type Props = {
  data?: AnalyticsSkillData;
  isLoading?: boolean;
  className?: string;
};

function InsightCard({
  icon: Icon,
  title,
  body,
  tone,
}: {
  icon: typeof Target;
  title: string;
  body: string;
  tone: "slate" | "rose" | "emerald";
}) {
  const toneClass =
    tone === "rose"
      ? "border-rose-200 bg-rose-50/90"
      : tone === "emerald"
        ? "border-emerald-200 bg-emerald-50/80"
        : "border-slate-200 bg-slate-50/80";

  return (
    <div className={cn("rounded-xl border p-4", toneClass)}>
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-slate-700" aria-hidden />
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
          {title}
        </p>
      </div>
      <p className="text-sm leading-relaxed text-slate-800">{body}</p>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Analiz yükleniyor">
      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Skeleton className="h-[280px] w-full rounded-xl" />
        <div className="space-y-3">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}

function NetTrendChart({
  data,
}: {
  data: AnalyticsSkillData["grafik_verisi_icin_trend"];
}) {
  const rows = data.map((p) => ({
    ...p,
    label: analyticsTrendChartLabel(p),
  }));

  if (rows.length === 0) {
    return (
      <p className="flex h-full min-h-[240px] items-center justify-center text-sm text-slate-400">
        Kronolojik trend verisi yok
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={rows} margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
        <defs>
          <linearGradient id="netTrendArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0f172a" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#0f172a" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#e2e8f0"
          strokeOpacity={0.65}
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "#64748b" }}
          axisLine={false}
          tickLine={false}
          interval={0}
          height={48}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#64748b" }}
          axisLine={false}
          tickLine={false}
          width={32}
        />
        <Tooltip
          formatter={(v) => [`${Number(v ?? 0)} net`, "Net"]}
          labelFormatter={(_, payload) => {
            const row = payload?.[0]?.payload as
              | { sinav?: string; tarih?: string }
              | undefined;
            if (!row) return "";
            return `${row.sinav ?? ""}${row.tarih && row.tarih !== "—" ? ` · ${row.tarih}` : ""}`;
          }}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            fontSize: 12,
          }}
        />
        <Area
          type="monotone"
          dataKey="net"
          name="Net"
          stroke="#0f172a"
          fill="url(#netTrendArea)"
          strokeWidth={2.5}
          dot={{ r: 4, fill: "#0f172a", stroke: "#fff", strokeWidth: 2 }}
          activeDot={{ r: 6 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function AnalyticsResponseCard({ data, isLoading, className }: Props) {
  const trendDelta = useMemo(
    () => (data ? computeTrendDelta(data.grafik_verisi_icin_trend) : null),
    [data]
  );

  return (
    <div
      className={cn(
        "w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm",
        className
      )}
      data-onyx-skill="analytics"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-slate-700" aria-hidden />
          <div>
            <h4 className="font-bold text-slate-900">YKS Başarı Analizi</h4>
            <p className="text-xs text-slate-500">
              Hedef vs net · kronolojik trend · acımasız gerçekçi rapor
            </p>
          </div>
        </div>
        {trendDelta != null ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums",
              trendDelta >= 0
                ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
                : "bg-rose-50 text-rose-800 ring-1 ring-rose-200"
            )}
          >
            {trendDelta >= 0 ? (
              <TrendingUp className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" aria-hidden />
            )}
            {trendDelta >= 0 ? "+" : ""}
            {trendDelta.toFixed(1)} net (dönem)
          </span>
        ) : null}
      </div>

      {isLoading || !data ? (
        <AnalyticsSkeleton />
      ) : (
        <>
          <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
            <div className="min-h-[280px] rounded-xl border border-slate-100 bg-slate-50/50 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Net gelişim eğrisi
              </p>
              <div className="h-[240px]">
                <NetTrendChart data={data.grafik_verisi_icin_trend} />
              </div>
            </div>

            <div className="space-y-3">
              <InsightCard
                icon={Target}
                title="Gerçekçi durum özeti"
                body={
                  data.analiz.gercekci_durum_ozeti ||
                  "Durum özeti üretilemedi."
                }
                tone="slate"
              />
              <InsightCard
                icon={AlertTriangle}
                title="Kırmızı alarm"
                body={
                  data.analiz.kirmizi_alarm_durumu ||
                  "Kritik alarm tespit edilmedi."
                }
                tone="rose"
              />
            </div>
          </div>

          {data.aksiyon_recetesi.length > 0 ? (
            <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
              <div className="mb-3 flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-slate-700" aria-hidden />
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Aksiyon reçetesi
                </p>
              </div>
              <ol className="space-y-2.5">
                {data.aksiyon_recetesi.map((step, i) => (
                  <li
                    key={`${i}-${step.slice(0, 24)}`}
                    className="flex gap-3 text-sm leading-relaxed text-slate-800"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
