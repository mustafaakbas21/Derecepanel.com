"use client";

import { rateToBgClass, rateToHex, rateToTextClass } from "@/lib/analiz/chart-theme";
import { cn } from "@/lib/utils";

type Gauge = { name: string; rate: number };

export function AmSubjectGauges({ gauges }: { gauges: Gauge[] }) {
  if (!gauges.length) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">Ders verisi henüz yok.</p>
    );
  }
  const sorted = [...gauges].sort((a, b) => b.rate - a.rate);
  return (
    <div className="space-y-4">
      {sorted.map((g, i) => (
        <div key={g.name} className="group">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white",
                  rateToBgClass(g.rate)
                )}
              >
                {i + 1}
              </span>
              <span className="truncate text-sm font-semibold text-slate-800">{g.name}</span>
            </div>
            <span className={cn("text-sm font-bold tabular-nums", rateToTextClass(g.rate))}>
              %{g.rate}
            </span>
          </div>
          <div className="am-gauge-track">
            <div
              className="am-gauge-fill transition-all duration-700 ease-out"
              style={{
                width: `${Math.min(100, g.rate)}%`,
                background: `linear-gradient(90deg, ${rateToHex(g.rate)}99, ${rateToHex(g.rate)})`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
