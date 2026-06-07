"use client";

import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

type OnyxLoadingStatusBarProps = {
  /** Görsel / vision analizi devam ediyor */
  analyzingVision?: boolean;
  className?: string;
};

export function OnyxLoadingStatusBar({
  analyzingVision = false,
  className,
}: OnyxLoadingStatusBarProps) {
  const label = analyzingVision
    ? "Onyx görseli inceliyor ve çözüm ağlarını kuruyor..."
    : "Onyx düşünüyor ve yanıtını hazırlıyor...";

  return (
    <div
      className={cn(
        "mx-auto mb-3 flex w-full max-w-3xl flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-2 duration-300",
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50/90 px-5 py-2 shadow-sm backdrop-blur-sm">
        <Sparkles
          size={16}
          className="text-indigo-500 animate-[spin_3s_linear_infinite]"
          aria-hidden
        />
        <span className="text-sm font-medium text-slate-600">{label}</span>
      </div>

      <div className="mt-2 h-[2px] w-48 overflow-hidden rounded-full bg-slate-100">
        <div className="onyx-status-progress-bar h-full w-full origin-left rounded-full bg-indigo-500" />
      </div>
    </div>
  );
}
