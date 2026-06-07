"use client";

import { useMemo } from "react";
import { LayoutGrid } from "lucide-react";

import type { PriorityRow } from "@/lib/analiz/types";
import { cn } from "@/lib/utils";

export type DersFilterOption = {
  id: string;
  label: string;
  count: number;
  kritikCount: number;
};

export function buildDersFilterOptions(
  dersOptions: string[],
  rows: PriorityRow[]
): DersFilterOption[] {
  const counts: Record<string, { total: number; kritik: number }> = {};
  rows.forEach((r) => {
    if (!counts[r.subjectName]) counts[r.subjectName] = { total: 0, kritik: 0 };
    counts[r.subjectName].total++;
    if (r.classCorrectRate < 40) counts[r.subjectName].kritik++;
  });

  return dersOptions
    .filter((d) => d !== "all")
    .map((d) => ({
      id: d,
      label: d,
      count: counts[d]?.total ?? 0,
      kritikCount: counts[d]?.kritik ?? 0,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "tr"));
}

export function AmDersFilterBar({
  value,
  onChange,
  subjects,
  totalCount,
  className,
}: {
  value: string;
  onChange: (id: string) => void;
  subjects: DersFilterOption[];
  totalCount: number;
  className?: string;
}) {
  const kritikTotal = useMemo(
    () => subjects.reduce((s, x) => s + x.kritikCount, 0),
    [subjects]
  );

  return (
    <div className={cn("am-v3-ders-bar", className)}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-500">Ders seçin</p>
        <span className="text-[11px] text-slate-400">
          {kritikTotal} kritik · {totalCount} soru
        </span>
      </div>
      <div className="am-v3-ders-bar__scroll flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => onChange("all")}
          className={cn(
            "am-v3-ders-btn shrink-0",
            value === "all" && "am-v3-ders-btn--active"
          )}
        >
          <LayoutGrid className="h-3.5 w-3.5 shrink-0 opacity-70" />
          <span>Tümü</span>
          <span className="am-v3-ders-btn__badge">{totalCount}</span>
        </button>
        {subjects.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id)}
            title={s.label}
            className={cn(
              "am-v3-ders-btn shrink-0",
              value === s.id && "am-v3-ders-btn--active",
              s.kritikCount > 0 && value !== s.id && "am-v3-ders-btn--has-kritik"
            )}
          >
            <span className="max-w-[140px] truncate">{s.label}</span>
            <span className="am-v3-ders-btn__badge">{s.count}</span>
            {s.kritikCount > 0 && (
              <span className="am-v3-ders-btn__dot" title={`${s.kritikCount} kritik`} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
