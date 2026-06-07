"use client";

import { cn } from "@/lib/utils";
import type { QuestionPoolItem } from "@/lib/test-maker/types";

type Props = {
  item: QuestionPoolItem;
  selected?: boolean;
  onToggle?: () => void;
};

export function QuestionPickCard({ item, selected, onToggle }: Props) {
  const tag = [item.ders, item.konu, item.kavram].filter(Boolean).join(" › ");
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "tr-q-card overflow-hidden rounded-xl border text-left transition",
        selected ? "border-slate-900 ring-2 ring-slate-900/20" : "border-slate-200 hover:border-slate-300"
      )}
    >
      <div className="relative aspect-[4/3] bg-slate-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.dataUrl} alt="" className="h-full w-full object-contain" />
        {selected ? (
          <span className="absolute right-2 top-2 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white">
            Seçili
          </span>
        ) : null}
      </div>
      <div className="space-y-1 p-2.5">
        <p className="line-clamp-2 text-[11px] font-medium text-slate-600">{tag || "Etiketsiz"}</p>
        {item.answer ? (
          <span className="inline-flex rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
            {item.answer}
          </span>
        ) : (
          <span className="inline-flex rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
            Cevapsız
          </span>
        )}
      </div>
    </button>
  );
}
