"use client";

import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

export type RadarPoint = {
  subject: string;
  yerlesen: number;
  ogrenci: number;
};

type Props = {
  data: RadarPoint[];
  className?: string;
};

export function NetRadarChart({ data, className }: Props) {
  if (!data.length) {
    return (
      <div
        className={`flex min-h-[280px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/80 text-sm text-slate-500 ${className ?? ""}`}
      >
        Branş verisi yok
      </div>
    );
  }

  return (
    <div className={className ?? "min-h-[300px] w-full"}>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart
          data={data}
          margin={{ top: 16, right: 40, bottom: 16, left: 40 }}
          outerRadius="62%"
        >
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fontSize: 11, fill: "#475569", fontWeight: 600 }}
            tickLine={false}
          />
          <Radar
            name="Yerleşen ort."
            dataKey="yerlesen"
            stroke="#0f172a"
            fill="#0f172a"
            fillOpacity={0.18}
            strokeWidth={2}
          />
          <Radar
            name="Senin netin"
            dataKey="ogrenci"
            stroke="#059669"
            fill="#059669"
            fillOpacity={0.22}
            strokeWidth={2}
          />
          <Legend
            verticalAlign="top"
            align="center"
            wrapperStyle={{ paddingBottom: 12, fontSize: 12, fontWeight: 600 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
