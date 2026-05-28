"use client";

import { cn } from "@/lib/utils";

export function FilterSegments<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      className="flex min-w-0 flex-1 flex-wrap gap-1 rounded-xl border border-slate-200/80 bg-slate-50/80 p-1"
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((opt) => {
        const pressed = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={pressed}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-[13px] font-semibold transition",
              pressed
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
