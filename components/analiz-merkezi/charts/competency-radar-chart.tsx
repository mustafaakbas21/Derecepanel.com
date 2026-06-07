"use client";

import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

import { AM_CHART } from "@/lib/analiz/chart-theme";
import { PolarCategoryTick } from "@/components/analiz-merkezi/charts/chart-axis-ticks";

export type RadarRow = {
  subject: string;
  student: number;
  class: number;
  top: number;
};

export type VersusState = { student: boolean; class: boolean; top: boolean };

export function CompetencyRadarChart({
  data,
  versus,
  id = "am-chart-radar",
}: {
  data: RadarRow[];
  versus: VersusState;
  id?: string;
}) {
  return (
    <div id={id} className="h-80 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="68%">
          <PolarGrid stroke={AM_CHART.grid} />
          <PolarAngleAxis
            dataKey="subject"
            tick={<PolarCategoryTick maxLen={18} />}
          />
          <PolarRadiusAxis
            domain={[0, 100]}
            tick={{ fontSize: 9, fill: AM_CHART.slate }}
            axisLine={false}
          />
          {versus.student && (
            <Radar
              name="Öğrenci"
              dataKey="student"
              stroke={AM_CHART.student}
              fill={AM_CHART.student}
              fillOpacity={0.4}
              strokeWidth={2}
            />
          )}
          {versus.class && (
            <Radar
              name="Sınıf ort."
              dataKey="class"
              stroke={AM_CHART.class}
              fill={AM_CHART.class}
              fillOpacity={0.25}
              strokeWidth={2}
            />
          )}
          {versus.top && (
            <Radar
              name="Birinci"
              dataKey="top"
              stroke={AM_CHART.top}
              fill={AM_CHART.top}
              fillOpacity={0.2}
              strokeWidth={2}
            />
          )}
          <Legend
            wrapperStyle={{ fontSize: 12, fontWeight: 600, paddingTop: 12 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
