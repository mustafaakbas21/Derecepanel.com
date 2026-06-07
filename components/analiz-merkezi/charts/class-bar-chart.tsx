"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AM_CHART } from "@/lib/analiz/chart-theme";
import { AmChartTooltip, ChartGradientDefs } from "@/components/analiz-merkezi/charts/chart-shell";

type Row = { name: string; doğru: number; yanlış: number; boş: number };

export function ClassBarChart({ data, id = "am-chart-classes" }: { data: Row[]; id?: string }) {
  return (
    <div id={id} className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
          <ChartGradientDefs />
          <CartesianGrid stroke={AM_CHART.gridLight} strokeDasharray="4 4" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: AM_CHART.slate, fontWeight: 600 }}
            axisLine={{ stroke: AM_CHART.grid }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            width={36}
            tick={{ fontSize: 11, fill: AM_CHART.slate }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={
              <AmChartTooltip
                formatter={(v, name) => [
                  String(v),
                  name === "doğru" ? "Doğru" : name === "yanlış" ? "Yanlış" : "Boş",
                ]}
              />
            }
            cursor={{ fill: "rgba(99, 102, 241, 0.06)" }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, fontWeight: 600, paddingTop: 8 }}
            formatter={(v) =>
              v === "doğru" ? "Doğru" : v === "yanlış" ? "Yanlış" : "Boş"
            }
          />
          <Bar
            dataKey="doğru"
            stackId="a"
            fill={AM_CHART.correct}
            radius={[0, 0, 0, 0]}
            maxBarSize={48}
          />
          <Bar dataKey="yanlış" stackId="a" fill={AM_CHART.wrong} maxBarSize={48} />
          <Bar
            dataKey="boş"
            stackId="a"
            fill={AM_CHART.empty}
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
