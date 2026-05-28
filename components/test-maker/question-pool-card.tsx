"use client";

import { Trash2 } from "lucide-react";

import type { AnswerLetter, QuestionPoolItem } from "@/lib/test-maker/types";
import { cn } from "@/lib/utils";

const LETTERS: AnswerLetter[] = ["A", "B", "C", "D", "E"];

type Props = {
  item: QuestionPoolItem;
  variant?: "havuz" | "kirpici";
  selected?: boolean;
  onSelect?: (checked: boolean) => void;
  onAnswer: (letter: AnswerLetter | null) => void;
  onDelete?: () => void;
  onSaveOne?: () => void;
};

export function QuestionPoolCard({
  item,
  variant = "havuz",
  selected,
  onSelect,
  onAnswer,
  onDelete,
  onSaveOne,
}: Props) {
  const tag = [item.ders, item.konu, item.kavram].filter(Boolean).join(" › ");

  return (
    <article
      className={cn(
        "sh-card group relative flex flex-col",
        variant === "kirpici" && "aks-card"
      )}
    >
      {variant === "kirpici" && onSelect && (
        <label className="absolute left-2 top-2 z-10 flex h-5 w-5 cursor-pointer items-center justify-center rounded border border-slate-300 bg-white/90">
          <input
            type="checkbox"
            className="h-3.5 w-3.5 accent-slate-800"
            checked={selected}
            onChange={(e) => onSelect(e.target.checked)}
          />
        </label>
      )}

      <div className="flex flex-wrap items-center gap-1.5 border-b border-[var(--header-border)] px-3 py-2 text-[11px]">
        {item.page != null && (
          <span className="tm-badge-meta">S.{item.page}</span>
        )}
        {(item.qNumber || item.soruNo) && (
          <span className="tm-badge-page">#{item.qNumber ?? item.soruNo}</span>
        )}
        {item.auto && (
          <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700">
            Otonom
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-slate-500" title={tag}>
          {tag || "Etiketsiz"}
        </span>
      </div>

      <div className="relative bg-slate-50 p-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.dataUrl}
          alt="Soru görseli"
          className="mx-auto max-h-64 w-full object-contain"
        />
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="absolute right-2 top-2 rounded-lg bg-white/90 p-1.5 text-slate-500 opacity-0 shadow transition hover:text-red-600 group-hover:opacity-100"
            title="Sil"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2 p-3">
        <p className="text-xs font-medium text-slate-500">Doğru Cevap</p>
        <div className="flex gap-1.5">
          {LETTERS.map((letter) => (
            <button
              key={letter}
              type="button"
              className={cn(
                "sh-ans-btn",
                item.answer === letter && "active"
              )}
              onClick={() => onAnswer(item.answer === letter ? null : letter)}
            >
              {letter}
            </button>
          ))}
        </div>
        {variant === "kirpici" && onSaveOne && (
          <button
            type="button"
            onClick={onSaveOne}
            className="tm-btn-primary mt-1 w-full py-2 text-xs"
          >
            Havuza kaydet
          </button>
        )}
      </div>
    </article>
  );
}
