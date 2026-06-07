"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AM_CHART, AM_GRADIENT_IDS } from "@/lib/analiz/chart-theme";
import { AmChartTooltip, ChartGradientDefs } from "@/components/analiz-merkezi/charts/chart-shell";

type Row = { name: string; actual: number | null; forecast: number | null };

export function TrendLineChart({
  data,
  id = "am-chart-trend",
}: {
  data: Row[];
  id?: string;
}) {
  return (
    <div id={id} className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
          <ChartGradientDefs />
          <CartesianGrid stroke={AM_CHART.gridLight} strokeDasharray="4 4" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: AM_CHART.slate, fontWeight: 600 }}
            axisLine={{ stroke: AM_CHART.grid }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 120]}
            width={32}
            tick={{ fontSize: 11, fill: AM_CHART.slate }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={
              <AmChartTooltip
                formatter={(v, name) => [
                  `${v} net`,
                  name === "actual" ? "Gerçek" : "Tahmin",
                ]}
              />
            }
          />
          <Area
            type="monotone"
            dataKey="actual"
            fill={`url(#${AM_GRADIENT_IDS.areaTrend})`}
            stroke="none"
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke={AM_CHART.student}
            strokeWidth={3}
            dot={{ r: 4, fill: AM_CHART.student, strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 6, fill: AM_CHART.violet }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="forecast"
            stroke={AM_CHART.forecast}
            strokeWidth={2}
            strokeDasharray="8 5"
            dot={{ r: 3, fill: AM_CHART.forecast, stroke: "#fff", strokeWidth: 1 }}
            connectNulls={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap justify-center gap-4 text-[11px] font-semibold">
        <span className="flex items-center gap-1.5 text-indigo-700">
          <span className="h-0.5 w-5 rounded bg-indigo-500" /> Gerçek net
        </span>
        <span className="flex items-center gap-1.5 text-violet-600">
          <span className="h-0.5 w-5 rounded border-t-2 border-dashed border-violet-400" />{" "}
          Otonom tahmin
        </span>
      </div>
    </div>
  );
}
