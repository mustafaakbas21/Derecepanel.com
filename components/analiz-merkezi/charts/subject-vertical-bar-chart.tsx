"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { rateToHex } from "@/lib/analiz/chart-theme";
import { AM_CHART } from "@/lib/analiz/chart-theme";
import { chartVerticalBarHeight, chartYAxisWidth } from "@/lib/analiz/chart-labels";
import { CategoryYAxisTick } from "@/components/analiz-merkezi/charts/chart-axis-ticks";
import { AmChartTooltip } from "@/components/analiz-merkezi/charts/chart-shell";

type Row = { name: string; rate: number };

export function SubjectVerticalBarChart({
  data,
  id = "am-chart-subjects",
  onBarClick,
}: {
  data: Row[];
  id?: string;
  onBarClick?: (name: string) => void;
}) {
  const labels = data.map((d) => d.name);
  const yWidth = chartYAxisWidth(labels, 36);
  const height = chartVerticalBarHeight(data.length, labels);

  return (
    <div id={id} style={{ height }} className="w-full min-h-[240px] min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 8, right: 20, left: 4, bottom: 8 }}
          barCategoryGap="18%"
        >
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: AM_CHART.slate }}
            axisLine={false}
            tickLine={false}
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
          <Tooltip
            content={<AmChartTooltip formatter={(v) => [`%${v}`, "Başarı"]} />}
            cursor={{ fill: "rgba(99, 102, 241, 0.08)" }}
          />
          <Bar
            dataKey="rate"
            radius={[0, 6, 6, 0]}
            maxBarSize={24}
            cursor={onBarClick ? "pointer" : "default"}
            onClick={(entry) => {
              const name = (entry as { name?: string }).name;
              if (name && onBarClick) onBarClick(name);
            }}
          >
            {data.map((row, i) => (
              <Cell key={i} fill={rateToHex(row.rate)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
