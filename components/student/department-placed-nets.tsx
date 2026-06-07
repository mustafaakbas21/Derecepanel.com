"use client";

import { Loader2 } from "lucide-react";

import { shortRadarLabel } from "@/components/yks-sim/net-sihirbazi-branch-row";
import type { BranchSpecItem, NetBand } from "@/lib/yks-sim/net-resolve";
import type { NsBranchId } from "@/lib/yks-sim/types";
import { cn } from "@/lib/utils";

type Props = {
  spec: BranchSpecItem[];
  placedNets: Partial<Record<NsBranchId, number>>;
  studentNets?: Partial<Record<NsBranchId, number>>;
  bands?: Partial<Record<NsBranchId, NetBand>>;
  loading?: boolean;
  className?: string;
};

function fmtNet(n: number | undefined) {
  if (n == null || !Number.isFinite(n)) return "—";
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function DepartmentPlacedNets({
  spec,
  placedNets,
  studentNets = {},
  bands = {},
  loading = false,
  className,
}: Props) {
  const totalPlaced = spec.reduce((sum, br) => sum + (placedNets[br.id] ?? 0), 0);
  const hasStudent = spec.some((br) => {
    const v = studentNets[br.id];
    return v != null && Number.isFinite(v);
  });

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-slate-500", className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        Bölüm netleri yükleniyor…
      </div>
    );
  }

  if (!spec.length) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Seçilen bölümün yerleşen netleri</h4>
          <p className="mt-0.5 text-xs text-slate-500">
            YÖK Atlas yerleşen ortalama net bandı
            {hasStudent ? " · son denemenle karşılaştırmalı" : ""}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2 text-right">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Toplam</p>
          <p className="text-lg font-bold tabular-nums text-slate-900">{fmtNet(totalPlaced)}</p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {spec.map((br) => {
          const placed = placedNets[br.id];
          const student = studentNets[br.id];
          const band = bands[br.id];
          const deficit =
            placed != null && student != null && Number.isFinite(student)
              ? Math.max(0, placed - student)
              : null;

          return (
            <div
              key={br.id}
              className={cn(
                "rounded-xl border px-3 py-2.5",
                deficit != null && deficit > 0
                  ? "border-amber-200/80 bg-amber-50/40"
                  : deficit === 0 && student != null
                    ? "border-emerald-200/80 bg-emerald-50/40"
                    : "border-slate-100 bg-slate-50/60"
              )}
            >
              <p className="truncate text-[11px] font-semibold text-slate-600" title={br.label}>
                {shortRadarLabel(br.id, br.label)}
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <p className="text-xl font-bold tabular-nums text-slate-900">{fmtNet(placed)}</p>
                <span className="text-[11px] text-slate-400">/ {br.max}</span>
              </div>
              {band ? (
                <p className="mt-0.5 text-[10px] text-slate-500">
                  Bant {fmtNet(band.lo)} – {fmtNet(band.hi)}
                </p>
              ) : null}
              {student != null && Number.isFinite(student) ? (
                <p className="mt-1 text-[11px] font-medium text-slate-700">
                  Senin netin:{" "}
                  <span className="tabular-nums text-slate-900">{fmtNet(student)}</span>
                  {deficit != null && deficit > 0 ? (
                    <span className="ml-1 text-amber-800">(−{fmtNet(deficit)})</span>
                  ) : null}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
