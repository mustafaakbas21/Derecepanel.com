"use client";

import { GripVertical } from "lucide-react";

import type { QuickPresetDef } from "@/lib/weekly-planner/quick-presets";
import { cn } from "@/lib/utils";

const PILL_STYLES: Record<QuickPresetDef["id"], string> = {
  paragraf: "border-emerald-200/80 bg-emerald-50/90 text-emerald-900 hover:border-emerald-300 hover:bg-emerald-50",
  hazir_problem:
    "border-orange-200/80 bg-orange-50/90 text-orange-950 hover:border-orange-300 hover:bg-orange-50",
};

type Props = {
  preset: QuickPresetDef;
  disabled?: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
};

export function QuickPresetPill({ preset, disabled, onDragStart, onDragEnd }: Props) {
  return (
    <button
      type="button"
      draggable={!disabled}
      disabled={disabled}
      title={`${preset.label} — takvime sürükleyin (${preset.shortHint})`}
      onDragStart={(e) => {
        if (disabled) return;
        e.dataTransfer.setData("text/plain", preset.id);
        e.dataTransfer.effectAllowed = "copy";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "inline-flex cursor-grab items-center gap-1.5 rounded-xl border px-3 py-2 text-left shadow-sm active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50",
        "transition-all duration-200 ease-out hover:-translate-y-px",
        PILL_STYLES[preset.id]
      )}
    >
      <GripVertical className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
      <span className="flex flex-col leading-tight">
        <span className="text-xs font-bold">{preset.label}</span>
        <span className="text-[10px] font-medium opacity-80">{preset.shortHint}</span>
      </span>
    </button>
  );
}
