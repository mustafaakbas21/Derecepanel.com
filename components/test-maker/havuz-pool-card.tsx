"use client";

import { Trash2 } from "lucide-react";

import type { AnswerLetter, QuestionPoolItem } from "@/lib/test-maker/types";
import { cn } from "@/lib/utils";

const LETTERS: AnswerLetter[] = ["A", "B", "C", "D", "E"];

type Props = {
  item: QuestionPoolItem;
  onAnswer: (letter: AnswerLetter | null) => void;
  onDelete: () => void;
};

export function HavuzPoolCard({ item, onAnswer, onDelete }: Props) {
  const tag = [item.ders, item.konu, item.kavram].filter(Boolean).join(" › ");

  return (
    <article className="havuz-card group">
      <div className="havuz-card__meta">
        {item.page != null ? (
          <span className="havuz-badge havuz-badge--page">S.{item.page}</span>
        ) : null}
        {(item.qNumber || item.soruNo) ? (
          <span className="havuz-badge havuz-badge--num">#{item.qNumber ?? item.soruNo}</span>
        ) : null}
        {item.auto ? <span className="havuz-badge havuz-badge--auto">Otonom</span> : null}
        <span className="havuz-card__tag truncate" title={tag}>
          {tag || "Etiketsiz"}
        </span>
      </div>

      <div className="havuz-card__img-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.dataUrl}
          alt="Soru görseli"
          className="havuz-card__img"
          loading="lazy"
          onError={(e) => {
            const t = e.currentTarget;
            t.onerror = null;
            t.src =
              "data:image/svg+xml," +
              encodeURIComponent(
                '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120"><rect fill="#f1f5f9" width="200" height="120"/><text x="100" y="64" text-anchor="middle" fill="#94a3b8" font-size="12">Görsel yüklenemedi</text></svg>'
              );
          }}
        />
        <button
          type="button"
          className="havuz-card__delete"
          onClick={onDelete}
          title="Havuzdan sil"
          aria-label="Soruyu sil"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="havuz-card__answers">
        <p className="havuz-card__answers-label">Doğru cevap</p>
        <div className="havuz-card__letters">
          {LETTERS.map((letter) => (
            <button
              key={letter}
              type="button"
              className={cn(
                "havuz-card__letter",
                item.answer === letter && "havuz-card__letter--active"
              )}
              onClick={() => onAnswer(item.answer === letter ? null : letter)}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}
