"use client";

import { BookOpen, CheckCircle2, CircleDashed, Loader2 } from "lucide-react";

import {
  konuTakipSolvedLabel,
  konuTakipStatusShortLabel,
  type KonuTakipQuestionContext,
} from "@/lib/analiz/konu-takip-bridge";
import { cn } from "@/lib/utils";

export function KonuTakipQuestionBadge({
  context,
  compact = false,
}: {
  context: KonuTakipQuestionContext;
  compact?: boolean;
}) {
  const solved = konuTakipSolvedLabel(context);
  const label = konuTakipStatusShortLabel(context.status);

  if (context.status === "bitti") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 font-bold text-emerald-800",
          compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[10px]"
        )}
        title="Konu Takip Merkezi: bu konu bitti olarak işaretlendi"
      >
        <CheckCircle2 className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} aria-hidden />
        {label}
        {solved && !compact ? <span className="font-semibold opacity-80">· {solved}</span> : null}
      </span>
    );
  }

  if (context.status === "calisiliyor") {
    return (
      <span
        className={cn(
          "inline-flex flex-wrap items-center gap-1 rounded-full border border-sky-200 bg-sky-50 font-bold text-sky-800",
          compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[10px]"
        )}
        title="Konu Takip Merkezi: bu konu üzerinde çalışılıyor"
      >
        <Loader2 className={cn(compact ? "h-3 w-3" : "h-3.5 w-3.5")} aria-hidden />
        {label}
        {solved ? (
          <span className="inline-flex items-center gap-0.5 font-semibold text-sky-700">
            <BookOpen className="h-3 w-3" aria-hidden />
            {solved}
          </span>
        ) : null}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 font-semibold text-slate-500",
        compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[10px]"
      )}
      title="Konu Takip Merkezi: bu konuya henüz başlanmadı"
    >
      <CircleDashed className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} aria-hidden />
      {label}
    </span>
  );
}
