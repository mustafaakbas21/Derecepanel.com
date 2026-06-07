"use client";

import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";

import { SOLVED_QUICK_STEPS } from "@/lib/konu-takip/constants";

export function QuestionCounter({
  value,
  onAdd,
  onSet,
}: {
  value: number;
  onAdd: (delta: number) => void;
  onSet: (next: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = () => {
    const next = Math.max(0, Math.round(Number(draft) || 0));
    if (next !== value) onSet(next);
    setDraft(String(next));
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onAdd(-10)}
          disabled={value <= 0}
          aria-label="10 soru çıkar"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <input
          inputMode="numeric"
          value={draft}
          onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ""))}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          aria-label="Çözülen soru sayısı"
          className="h-8 w-16 rounded-lg border border-slate-200 bg-white text-center text-sm font-bold tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
        />
        <span className="text-xs text-slate-400">soru</span>
      </div>
      <div className="flex items-center gap-1">
        {SOLVED_QUICK_STEPS.map((step) => (
          <button
            key={step}
            type="button"
            onClick={() => onAdd(step)}
            className="inline-flex items-center gap-0.5 rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
          >
            <Plus className="h-3 w-3" />
            {step}
          </button>
        ))}
      </div>
    </div>
  );
}
