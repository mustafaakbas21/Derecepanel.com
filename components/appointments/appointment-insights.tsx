"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, CalendarRange, CalendarDays, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DAY_SHORT } from "@/lib/appointments/constants";
import type { Appointment } from "@/lib/appointments/types";
import { computeWeekCounts, weekMetrics } from "@/lib/appointments/utils";
import { cn } from "@/lib/utils";

function readChartColors() {
  if (typeof window === "undefined") {
    return { bar: "#2563eb", tick: "#64748b", grid: "#e2e8f0" };
  }
  const s = getComputedStyle(document.documentElement);
  return {
    bar: s.getPropertyValue("--btn-primary-bg").trim() || "#2563eb",
    tick: s.getPropertyValue("--text-muted").trim() || "#64748b",
    grid: s.getPropertyValue("--border-subtle").trim() || "#e2e8f0",
  };
}

function MetricTile({
  label,
  value,
  sub,
  icon: Icon,
  className,
}: {
  label: string;
  value: string;
  sub: string;
  icon: typeof CalendarDays;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:gap-4 sm:py-6",
        className
      )}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <Icon className="h-5 w-5" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-slate-500">{label}</p>
        <p className="mt-1 truncate text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.65rem]">
          {value}
        </p>
        <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-slate-400">{sub}</p>
      </div>
    </div>
  );
}

export function AppointmentInsights({ list }: { list: Appointment[] }) {
  const [colors, setColors] = useState(readChartColors);
  const m = weekMetrics(list);
  const { counts } = useMemo(() => computeWeekCounts(list), [list]);
  const data = DAY_SHORT.map((day, i) => ({ day, count: counts[i] ?? 0 }));
  const maxVal = Math.max(4, ...counts, 0) + 1;

  const peakValue =
    m.total === 0 || m.peakCount === 0 ? "—" : (m.peakDay ?? "—");
  const peakSub =
    m.total === 0 || m.peakCount === 0
      ? "Bu hafta henüz randevu yok"
      : `${m.peakCount} görüşme`;

  useEffect(() => {
    const refresh = () => setColors(readChartColors());
    refresh();
    const obs = new MutationObserver(refresh);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });
    window.addEventListener("storage", refresh);
    return () => {
      obs.disconnect();
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return (
    <section
      className="overflow-hidden rounded-[1.35rem] border border-slate-200/70 bg-white"
      style={{ boxShadow: "var(--card-shadow)" }}
      aria-label="Haftalık randevu özeti"
    >
      {/* KPI şeridi — tam genişlik, eşit üç sütun */}
      <div className="grid grid-cols-1 divide-y divide-slate-100 md:grid-cols-3 md:divide-x md:divide-y-0">
        <MetricTile
          label="Bu hafta"
          value={String(m.total)}
          sub="Toplam planlı görüşme"
          icon={CalendarDays}
        />
        <MetricTile
          label="En yoğun gün"
          value={peakValue}
          sub={peakSub}
          icon={TrendingUp}
        />
        <MetricTile
          label="Hafta aralığı"
          value={m.rangeLabel}
          sub="Pazartesi – Pazar"
          icon={CalendarRange}
        />
      </div>

      {/* Grafik — tam genişlik */}
      <div className="border-t border-slate-100 bg-slate-50/40 p-5 sm:p-6">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-slate-400" />
              <h3 className="text-lg font-bold text-slate-900">Haftalık yoğunluk</h3>
            </div>
            <p className="mt-0.5 text-[13px] text-slate-500">
              Günlük görüşme sayısı · iptal edilenler hariç
            </p>
          </div>
          <p className="text-[12px] font-medium text-slate-400">Pzt – Paz</p>
        </div>

        <div
          className="h-[220px] w-full min-h-[200px] sm:h-[240px]"
          role="img"
          aria-label="Bu haftanın günlük randevu sayıları"
        >
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={data} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.grid} />
              <XAxis
                dataKey="day"
                tick={{ fill: colors.tick, fontSize: 12, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                domain={[0, maxVal]}
                tick={{ fill: colors.tick, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip
                cursor={{ fill: "rgba(148,163,184,0.1)" }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  fontSize: 13,
                }}
                formatter={(v) => [`${v} randevu`, ""]}
                labelFormatter={(l) => String(l)}
              />
              <Bar dataKey="count" fill={colors.bar} radius={[8, 8, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
