"use client";

import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

import type { AnalizDataQuality } from "@/lib/analiz/matrix-quality";
import { cn } from "@/lib/utils";

type Props = {
  quality: AnalizDataQuality;
  className?: string;
};

export function MatrixStatusBanner({ quality, className }: Props) {
  if (quality.banner === "ok") {
    return (
      <div
        className={cn(
          "flex gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-950",
          className
        )}
        role="status"
      >
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
        <p>{quality.message}</p>
      </div>
    );
  }

  const isWarn = quality.banner === "missing-konu";
  return (
    <div
      className={cn(
        "flex gap-2 rounded-lg border px-3 py-2.5 text-xs",
        isWarn
          ? "border-amber-200 bg-amber-50 text-amber-950"
          : "border-rose-200 bg-rose-50 text-rose-950",
        className
      )}
      role="status"
    >
      {isWarn ? (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
      ) : (
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden />
      )}
      <p>{quality.message}</p>
    </div>
  );
}
