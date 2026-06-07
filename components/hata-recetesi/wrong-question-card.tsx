"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

import { resolveCloudImageDataUrl } from "@/lib/appwrite/blob-client";
import {
  normHataKaynagi,
  normHataTipi,
  normOgrenci,
  questionHasCloudImage,
  questionImageUrl,
} from "@/lib/hata-recetesi/filters";
import type { WrongQuestionRecord } from "@/lib/hata-recetesi/types";
import type { AnswerLetter } from "@/lib/test-maker/types";
import { cn } from "@/lib/utils";

const LETTERS: AnswerLetter[] = ["A", "B", "C", "D", "E"];

type Props = {
  item: WrongQuestionRecord;
  mode: "pool" | "recete";
  selected?: boolean;
  onSelect?: (checked: boolean) => void;
  onAnswer?: (letter: AnswerLetter | null) => void;
  onDelete?: () => void;
};

export function WrongQuestionCard({
  item,
  mode,
  selected,
  onSelect,
  onAnswer,
  onDelete,
}: Props) {
  const inlineImg = questionImageUrl(item);
  const [img, setImg] = useState(inlineImg);

  useEffect(() => {
    setImg(inlineImg);
    if (inlineImg || !questionHasCloudImage(item)) return;
    let cancelled = false;
    void resolveCloudImageDataUrl({
      dataUrl: item.dataUrl,
      imageFileId: item.imageFileId,
      imageBucketId: item.imageBucketId,
    }).then((url) => {
      if (!cancelled && url) setImg(url);
    });
    return () => {
      cancelled = true;
    };
  }, [inlineImg, item]);
  const hataTipi = normHataTipi(item);
  const kaynak = normHataKaynagi(item);
  const ogrenci = normOgrenci(item);
  const tag = [item.ders, item.konu, item.kavram].filter(Boolean).join(" › ");
  const readonlyAnswers = mode === "recete";

  return (
    <article
      className={cn(
        "hr-q-card group",
        mode === "recete" && selected && "hr-q-card--selected"
      )}
    >
      {mode === "recete" && onSelect ? (
        <label className="hr-q-card__select">
          <input
            type="checkbox"
            className="h-3.5 w-3.5 accent-slate-900"
            checked={selected}
            onChange={(e) => onSelect(e.target.checked)}
          />
          Seç
        </label>
      ) : null}

      <div className="hr-q-card__head">
        <span
          className={cn(
            "hr-badge",
            hataTipi === "bos" ? "hr-badge--empty" : "hr-badge--wrong"
          )}
        >
          {hataTipi === "bos" ? "Boş" : "Yanlış"}
        </span>
        {kaynak ? (
          <span className="hr-badge hr-badge--source">
            {kaynak === "deneme" ? "Deneme" : "Soru bankası"}
          </span>
        ) : null}
        {ogrenci ? (
          <span className="hr-badge hr-badge--student" title={ogrenci}>
            {ogrenci}
          </span>
        ) : null}
        <span className="hr-q-card__tag" title={tag}>
          {tag || "Etiketsiz"}
        </span>
      </div>

      {img ? (
        <div className="hr-q-card__media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt="Hatalı soru" className="hr-q-card__img" />
          {onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="hr-q-card__delete"
              title="Sil"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      ) : (
        <p className="px-4 py-8 text-center text-xs text-slate-400">Görsel yok</p>
      )}

      <div
        className={cn(
          "hr-q-card__answers",
          readonlyAnswers && "hr-q-card__answers--readonly"
        )}
      >
        {LETTERS.map((letter) => (
          <button
            key={letter}
            type="button"
            className={cn(
              "hr-q-card__letter",
              item.answer === letter && "hr-q-card__letter--on"
            )}
            onClick={() => onAnswer?.(item.answer === letter ? null : letter)}
          >
            {letter}
          </button>
        ))}
      </div>
    </article>
  );
}
