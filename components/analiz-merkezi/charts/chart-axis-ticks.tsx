"use client";

import { shortenChartLabel } from "@/lib/analiz/chart-labels";

type CategoryTickProps = {
  x?: number;
  y?: number;
  payload?: { value?: string };
  maxLen?: number;
};

export function CategoryYAxisTick({
  x = 0,
  y = 0,
  payload,
  maxLen = 34,
}: CategoryTickProps) {
  const full = String(payload?.value ?? "");
  const label = shortenChartLabel(full, maxLen);
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={-8}
        y={0}
        dy={4}
        textAnchor="end"
        fill="#334155"
        fontSize={11}
        fontWeight={600}
      >
        <title>{full}</title>
        {label}
      </text>
    </g>
  );
}

type PolarTickProps = CategoryTickProps & {
  textAnchor?: string;
};

export function PolarCategoryTick({
  x = 0,
  y = 0,
  payload,
  textAnchor = "middle",
  maxLen = 15,
}: PolarTickProps) {
  const full = String(payload?.value ?? "");
  const label = shortenChartLabel(full, maxLen);
  return (
    <text
      x={x}
      y={y}
      textAnchor={textAnchor as "middle" | "start" | "end" | "inherit"}
      fill="#475569"
      fontSize={10}
      fontWeight={600}
    >
      <title>{full}</title>
      {label}
    </text>
  );
}
