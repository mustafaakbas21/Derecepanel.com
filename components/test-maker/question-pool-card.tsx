"use client";

import { Trash2 } from "lucide-react";

import type { AnswerLetter, QuestionPoolItem } from "@/lib/test-maker/types";
import { cn } from "@/lib/utils";

const LETTERS: AnswerLetter[] = ["A", "B", "C", "D", "E"];

type Props = {
  item: QuestionPoolItem;
  variant?: "havuz" | "kirpici";
  selected?: boolean;
  active?: boolean;
  animateEnter?: boolean;
  col?: string;
  onSelect?: (checked: boolean) => void;
  onActivate?: () => void;
  onAnswer: (letter: AnswerLetter | null) => void;
  onDelete?: () => void;
  onSaveOne?: () => void;
  cardRef?: (el: HTMLElement | null) => void;
};

export function QuestionPoolCard({
  item,
  variant = "havuz",
  selected,
  active,
  animateEnter,
  col,
  onSelect,
  onActivate,
  onAnswer,
  onDelete,
  onSaveOne,
  cardRef,
}: Props) {
  const tag = [item.ders, item.konu, item.kavram].filter(Boolean).join(" › ");
  const colLabel = col === "sol" ? "Sol" : col === "sag" ? "Sağ" : col;

  return (
    <article
      ref={cardRef}
      data-item-id={item.uuid}
      role="button"
      tabIndex={onActivate ? 0 : undefined}
      onClick={onActivate}
      onKeyDown={
        onActivate
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onActivate();
              }
            }
          : undefined
      }
      className={cn(
        "sh-card group relative flex flex-col",
        variant === "kirpici" && "aks-card cursor-pointer",
        animateEnter && "aks-card-enter",
        active && "aks-card--active"
      )}
    >
      {variant === "kirpici" && onSelect && (
        <label
          className="absolute left-2 top-2 z-10 flex h-5 w-5 cursor-pointer items-center justify-center rounded border border-slate-300 bg-white/90"
          onClick={(e) => e.stopPropagation()}
        >
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
        {colLabel ? (
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
            {colLabel}
          </span>
        ) : null}
        {(item.qNumber || item.soruNo) && (
          <span className="tm-badge-page">#{item.qNumber ?? item.soruNo}</span>
        )}
        {item.auto && (
          <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700">
            Otonom
          </span>
        )}
        {item.sourcePdf ? (
          <span
            className="teacher-only-ui max-w-[45%] truncate rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-600 print:hidden"
            title={item.sourcePdf}
          >
            {item.sourcePdf}
          </span>
        ) : null}
        <span className="min-w-0 flex-1 truncate text-slate-500" title={tag}>
          {tag || "Etiketsiz"}
        </span>
      </div>

      <div className="relative bg-slate-50 p-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.dataUrl}
          alt="Soru görseli"
          className={cn(
            "mx-auto w-full object-contain",
            variant === "kirpici" ? "aks-card-img max-h-40" : "max-h-64"
          )}
        />
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute right-2 top-2 rounded-lg bg-white/90 p-1.5 text-slate-500 opacity-0 shadow transition hover:text-red-600 group-hover:opacity-100"
            title="Sil"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2 p-3" onClick={(e) => e.stopPropagation()}>
        <p className="text-xs font-medium text-slate-500">Doğru Cevap</p>
        <div className="aks-answer-row flex gap-1.5">
          {LETTERS.map((letter) => (
            <button
              key={letter}
              type="button"
              data-ans={letter}
              className={cn(
                variant === "kirpici" ? "aks-ans-btn" : "sh-ans-btn",
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
