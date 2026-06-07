"use client";

import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

export function DifficultyStars({
  value,
  onChange,
  readOnly,
  size = "md",
}: {
  value: number;
  onChange?: (n: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md";
}) {
  const sz = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";
  const starClass = (n: number) =>
    cn(sz, n <= value ? "fill-amber-400 text-amber-500" : "text-slate-300");

  if (readOnly) {
    return (
      <div className="flex gap-0.5" role="img" aria-label={`Zorluk ${value} / 5`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className="inline-flex rounded p-0.5">
            <Star className={starClass(n)} aria-hidden />
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-0.5" role="radiogroup" aria-label={`Zorluk ${value} / 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          className="rounded p-0.5 transition-colors hover:bg-amber-50"
          aria-label={`Seviye ${n}`}
          aria-pressed={n <= value}
        >
          <Star className={starClass(n)} />
        </button>
      ))}
    </div>
  );
}
