"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { rateToHex, AM_CHART } from "@/lib/analiz/chart-theme";
import { chartVerticalBarHeight, chartYAxisWidth } from "@/lib/analiz/chart-labels";
import { CategoryYAxisTick } from "@/components/analiz-merkezi/charts/chart-axis-ticks";
import { AmChartTooltip } from "@/components/analiz-merkezi/charts/chart-shell";

type Row = { name: string; rate: number };

export function CrossSubjectsBarChart({
  data,
  id = "am-chart-cross-subjects",
}: {
  data: Row[];
  id?: string;
}) {
  const labels = data.map((d) => d.name);
  const yWidth = chartYAxisWidth(labels, 36);
  const height = chartVerticalBarHeight(data.length, labels);

  return (
    <div id={id} style={{ height }} className="w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 8, right: 24, left: 4, bottom: 8 }}
          barCategoryGap="18%"
        >
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: AM_CHART.slate }}
            axisLine={false}
            tickFormatter={(v) => `%${v}`}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={yWidth}
            interval={0}
            tick={<CategoryYAxisTick maxLen={36} />}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<AmChartTooltip formatter={(v) => [`%${v}`, "Hakimiyet"]} />} />
          <Bar dataKey="rate" radius={[0, 8, 8, 0]} maxBarSize={26}>
            {data.map((row, i) => (
              <Cell key={i} fill={rateToHex(row.rate)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
