"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

import { AM_CHART } from "@/lib/analiz/chart-theme";
import { PolarCategoryTick } from "@/components/analiz-merkezi/charts/chart-axis-ticks";

type Row = { topicName: string; rate: number };

export function CrossRadarChart({
  data,
  id = "am-chart-cross-radar",
}: {
  data: Row[];
  id?: string;
}) {
  const tall = data.length > 6;
  return (
    <div
      id={id}
      className={tall ? "h-[22rem] w-full min-w-0" : "h-80 w-full min-w-0"}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={tall ? "62%" : "68%"}
        >
          <PolarGrid stroke={AM_CHART.grid} />
          <PolarAngleAxis
            dataKey="topicName"
            tick={<PolarCategoryTick maxLen={14} />}
          />
          <PolarRadiusAxis
            domain={[0, 100]}
            tick={{ fontSize: 9, fill: AM_CHART.slate }}
          />
          <Radar
            dataKey="rate"
            stroke={AM_CHART.violet}
            fill={AM_CHART.violet}
            fillOpacity={0.45}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
