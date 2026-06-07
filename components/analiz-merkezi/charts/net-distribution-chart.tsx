"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { AM_CHART } from "@/lib/analiz/chart-theme";
import { AmChartTooltip, ChartGradientDefs } from "@/components/analiz-merkezi/charts/chart-shell";

type Row = { range: string; count: number; fill: string };

export function NetDistributionChart({
  data,
  id = "am-chart-net-dist",
}: {
  data: Row[];
  id?: string;
}) {
  return (
    <div id={id} className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
          <ChartGradientDefs />
          <XAxis
            dataKey="range"
            tick={{ fontSize: 10, fill: AM_CHART.slate, fontWeight: 600 }}
            axisLine={{ stroke: AM_CHART.grid }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            width={28}
            tick={{ fontSize: 11, fill: AM_CHART.slate }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={
              <AmChartTooltip
                formatter={(v) => [`${v} öğrenci`, "Adet"]}
              />
            }
            cursor={{ fill: "rgba(99, 102, 241, 0.08)" }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40}>
            {data.map((row, i) => (
              <Cell key={i} fill={row.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
