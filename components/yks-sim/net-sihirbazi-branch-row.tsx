"use client";

import { Input } from "@/components/ui/input";
import { formatNsNet, type BranchSpecItem, type NetBand } from "@/lib/yks-sim/net-resolve";
import type { NsBranchId } from "@/lib/yks-sim/types";
import { cn } from "@/lib/utils";

type Props = {
  branch: BranchSpecItem;
  band?: NetBand;
  placedMid: number;
  netSource?: "json" | "model" | "";
  studentValue: string;
  onStudentChange: (value: string) => void;
};

function placedNetLabel(source?: "json" | "model" | ""): string {
  if (source === "json") return "Yerleşen ort. net";
  if (source === "model") return "Referans net";
  return "Yerleşen net";
}

function statusMeta(student: number | null, lo: number, hi: number) {
  if (student == null) return { label: "", className: "border-slate-200 bg-white" };
  if (student < lo)
    return {
      label: `Bandın ~${(lo - student).toFixed(1)} net altında`,
      className: "border-red-200/80 bg-red-50/90",
    };
  if (student > hi)
    return {
      label: `Bandın ~${(student - hi).toFixed(1)} net üstünde`,
      className: "border-emerald-200/80 bg-emerald-50/90",
    };
  return {
    label: "Bant içinde",
    className: "border-sky-200/80 bg-sky-50/70",
  };
}

export function NetSihirbaziBranchRow({
  branch,
  band,
  placedMid,
  netSource = "",
  studentValue,
  onStudentChange,
}: Props) {
  const lo = band?.lo ?? 0;
  const hi = band?.hi ?? branch.max;
  const mid = placedMid;
  const st = studentValue.trim() !== "" ? Number(studentValue) : null;
  const pct = branch.max > 0 ? Math.min(100, (mid / branch.max) * 100) : 0;
  const status = statusMeta(Number.isFinite(st) ? st : null, lo, hi);
  const hasBand = band != null && Number.isFinite(lo) && Number.isFinite(hi);

  return (
    <article
      className={cn(
        "rounded-xl border p-3 sm:p-4 transition-colors",
        status.className
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold leading-snug text-slate-900">{branch.label}</h4>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            {placedNetLabel(netSource)}
          </p>
          <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-2xl font-bold tabular-nums text-slate-900">
              {formatNsNet(mid)}
            </span>
            <span className="text-xs text-slate-400">/ {branch.max} net</span>
          </div>
          {hasBand ? (
            <p className="mt-1 text-[11px] text-slate-500">
              Bant {formatNsNet(lo)} – {formatNsNet(hi)}
              {netSource === "model" ? " · taban sırası tahmini" : ""}
            </p>
          ) : null}
          <div className="mt-2 h-2 max-w-xs overflow-hidden rounded-full bg-slate-200/80">
            <div
              className="h-full rounded-full bg-slate-800 transition-[width]"
              style={{ width: `${pct}%` }}
            />
          </div>
          {status.label ? (
            <p className="mt-1.5 text-[11px] font-medium text-slate-600">{status.label}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Senin netin
          </span>
          <Input
            type="number"
            step="0.25"
            min={0}
            max={branch.max}
            placeholder="—"
            value={studentValue}
            onChange={(e) => onStudentChange(e.target.value)}
            className="h-10 w-24 text-center text-sm font-semibold"
            aria-label={`${branch.label} netin`}
          />
        </div>
      </div>
    </article>
  );
}

export function shortRadarLabel(id: NsBranchId, label: string): string {
  const map: Partial<Record<NsBranchId, string>> = {
    tyt_tr: "TYT Tr",
    tyt_mat: "TYT Mat",
    tyt_fen: "TYT Fen",
    tyt_sos: "TYT Sos",
    ayt_mat: "AYT Mat",
    ayt_fiz: "Fizik",
    ayt_kim: "Kimya",
    ayt_bio: "Biyo",
    ayt_edb: "Edeb.",
    ayt_tar1: "Tar-1",
    ayt_cog1: "Coğ-1",
    ayt_tar2: "Tar-2",
    ayt_cog2: "Coğ-2",
    ayt_dil: "YDT",
  };
  return map[id] ?? (label.length > 14 ? `${label.slice(0, 12)}…` : label);
}
