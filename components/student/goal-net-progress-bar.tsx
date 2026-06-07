"use client";

import { cn } from "@/lib/utils";
import type { GoalNetProgress } from "@/lib/yks-sim/goal-net-progress";

type Props = {
  progress: GoalNetProgress | null;
  className?: string;
  showBranches?: boolean;
  /** false ise yalnızca branş çubukları (net analizi paneli) */
  showSummary?: boolean;
};

function barTone(pct: number) {
  if (pct >= 100) return "bg-emerald-500";
  if (pct >= 70) return "bg-orange-500";
  return "bg-amber-500";
}

export function GoalNetProgressBar({
  progress,
  className,
  showBranches = false,
  showSummary = true,
}: Props) {
  if (!progress) {
    if (!showSummary) return null;
    return (
      <div
        className={cn(
          "rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600",
          className
        )}
      >
        Son deneme sonucun bulunamadı. Deneme yükledikten sonra hedefe ne kadar kaldığını burada
        görebilirsin.
      </div>
    );
  }

  const done = progress.remaining <= 0;

  return (
    <div className={cn("space-y-3", className)}>
      {showSummary ? (
        <div
          className={cn(
            "rounded-xl border px-4 py-3.5",
            done ? "border-emerald-200/80 bg-emerald-50/70" : "border-slate-200/80 bg-slate-50/60"
          )}
        >
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Hedef net ilerlemesi
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">
                {done ? (
                  "Hedefe ulaştın — son denemene göre yerleşen bandına uygun görünüyorsun."
                ) : (
                  <>
                    Hedefe yaklaşmak için{" "}
                    <span className="tabular-nums text-amber-800">~{progress.remaining} net</span>{" "}
                    kaldı
                  </>
                )}
              </p>
            </div>
            <p
              className={cn(
                "text-2xl font-bold tabular-nums",
                done ? "text-emerald-700" : "text-slate-900"
              )}
            >
              %{Math.round(progress.progressPct)}
            </p>
          </div>

          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200/80">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                done ? "bg-emerald-500" : barTone(progress.progressPct)
              )}
              style={{ width: `${Math.min(100, progress.progressPct)}%` }}
              role="progressbar"
              aria-valuenow={Math.round(progress.progressPct)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Hedef net ilerlemesi"
            />
          </div>

          <p className="mt-2 text-xs text-slate-500">
            {progress.branchCount} branş · yerleşen ortalama net bandına göre
          </p>
        </div>
      ) : null}

      {showBranches && progress.branches.length > 0 ? (
        <div className="space-y-2">
          {progress.branches.map((br) => (
            <div key={br.id} className="rounded-lg border border-slate-100 bg-white px-3 py-2">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate font-medium text-slate-800">{br.label}</span>
                <span className="shrink-0 tabular-nums text-slate-600">
                  {br.student} / {br.target}
                  {br.remaining != null ? (
                    <span className="ml-1 font-medium text-amber-700">(−{br.remaining})</span>
                  ) : null}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn("h-full rounded-full", barTone(br.pct))}
                  style={{ width: `${Math.min(100, br.pct)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
