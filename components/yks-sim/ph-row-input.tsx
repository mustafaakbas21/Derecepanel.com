"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PhRow } from "@/lib/yks-sim/puan-hesaplama-config";
import { clampRowInput } from "@/lib/yks-sim/puan-hesaplama-engine";
import type { RowInput, RowNetResult } from "@/lib/yks-sim/puan-hesaplama-engine";
import { fmtNet } from "@/lib/yks-sim/puan-hesaplama-engine";
import { cn } from "@/lib/utils";

type Props = {
  row: PhRow;
  value: RowInput;
  net: RowNetResult;
  onChange: (next: RowInput) => void;
};

export function PhRowInput({ row, value, net, onChange }: Props) {
  const pct =
    row.maxQ > 0 && net.has
      ? Math.min(100, Math.max(0, (net.net / row.maxQ) * 100))
      : 0;

  const dNum = net.has ? net.d : parseInt(value.d, 10) || 0;
  const maxWrong = Math.max(0, row.maxQ - dNum);

  const applyChange = (patch: Partial<RowInput>) => {
    const next = clampRowInput({ ...value, ...patch }, row.maxQ);
    onChange(next);
  };

  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_4.5rem_4.5rem_auto] items-center gap-2 border-b border-slate-100 py-2.5 last:border-0 sm:gap-3",
        net.invalid && "rounded-lg bg-orange-50/50 ring-1 ring-orange-400/80 ring-offset-1"
      )}
    >
      <div className="col-span-full grid min-w-0 grid-cols-1 gap-1.5 sm:col-span-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-medium text-slate-800">{row.label}</span>
          <span className="shrink-0 text-[10px] font-semibold text-slate-400">
            max {row.maxQ} soru
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-slate-800 transition-[width] duration-150 ease-out"
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuenow={net.has ? net.net : 0}
            aria-valuemin={0}
            aria-valuemax={row.maxQ}
          />
        </div>
        {net.invalid ? (
          <p className="text-[11px] font-medium text-orange-700" role="alert">
            Doğru + yanlış toplamı {row.maxQ} soruyu geçemez (şu an: {net.d + net.y})
          </p>
        ) : null}
      </div>

      <div>
        <Label className="sr-only">{row.label} doğru</Label>
        <Input
          type="number"
          min={0}
          max={row.maxQ}
          step={1}
          inputMode="numeric"
          placeholder="D"
          value={value.d}
          onChange={(e) => applyChange({ d: e.target.value })}
          className="h-9 text-center text-sm font-semibold"
          aria-invalid={net.invalid}
        />
      </div>
      <div>
        <Label className="sr-only">{row.label} yanlış</Label>
        <Input
          type="number"
          min={0}
          max={maxWrong}
          step={1}
          inputMode="numeric"
          placeholder="Y"
          value={value.y}
          onChange={(e) => applyChange({ y: e.target.value })}
          className="h-9 text-center text-sm font-semibold"
          aria-invalid={net.invalid}
        />
      </div>
      <span
        className={cn(
          "inline-flex min-w-[3.25rem] justify-center rounded-full px-2 py-1 text-xs font-bold tabular-nums",
          net.has ? "bg-slate-100 text-slate-800" : "bg-slate-50 text-slate-400"
        )}
      >
        {net.has ? fmtNet(net.net) : "—"}
      </span>
    </div>
  );
}
