"use client";

import { GripVertical, Trash2 } from "lucide-react";

import type { QuestionAnswer, TMConfig, TMQuestion } from "@/lib/test-maker/types";
import { cn } from "@/lib/utils";

const OPTION_LETTERS = ["A", "B", "C", "D", "E"] as const;

/** Baskı/PDF — soru altında düz çözüm boşluğu (kutucuk yok) */
export function QuestionSolveSpace() {
  return <div className="tm-q-solve-space h-9 w-full shrink-0" aria-hidden />;
}

type QuestionItemProps = {
  question: TMQuestion;
  index: number;
  config: TMConfig;
  showChoices: boolean;
  measurementOnly?: boolean;
  onAnswer: (letter: QuestionAnswer) => void;
  onDelete: () => void;
  onCropClick?: () => void;
};

function AnswerChoicePicker({
  question,
  showChoices,
  onAnswer,
}: {
  question: TMQuestion;
  showChoices: boolean;
  onAnswer: (letter: QuestionAnswer) => void;
}) {
  if (!showChoices) return null;

  return (
    <div className="tm-q-answer-picker teacher-only-ui mt-4 shrink-0 print:hidden">
      <span className="mb-2 block text-sm font-semibold text-slate-700">Doğru şık</span>
      <div className="flex gap-2" role="group" aria-label="Doğru şık">
        {OPTION_LETTERS.map((option) => {
          const selected = question.answer === option;
          return (
            <button
              key={option}
              type="button"
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold transition-colors",
                selected
                  ? "bg-emerald-100 text-emerald-700"
                  : "border border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-200"
              )}
              data-letter={option}
              aria-pressed={selected}
              aria-label={`Şık ${option}`}
              onClick={() => onAnswer(option)}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function QuestionItem({
  question,
  index,
  config,
  showChoices,
  measurementOnly = false,
  onAnswer,
  onDelete,
  onCropClick,
}: QuestionItemProps) {
  const meta = [config.dersLabel, config.konuLabel].filter(Boolean).join(" — ");
  const hasImage = Boolean(question.imageDataUrl);

  return (
    <div
      className="tm-q-item group relative flex h-fit w-full flex-col rounded-lg border border-slate-200 bg-white p-4 transition-all hover:shadow-sm"
      data-q-id={question.id}
      data-order={index + 1}
      data-correct={question.answer ?? ""}
      data-cropped={hasImage ? "1" : "0"}
    >
      {!measurementOnly ? (
        <div className="teacher-only-ui absolute right-2 top-2 z-10 hidden items-center gap-1 rounded-md border border-slate-100 bg-white/95 p-0.5 shadow-sm group-hover:flex print:hidden">
        <span
          className="tm-q-handle cursor-grab rounded p-1.5 text-slate-500 hover:bg-slate-100 active:cursor-grabbing"
          title="Taşı"
        >
          <GripVertical className="h-4 w-4" />
        </span>
        <button
          type="button"
          className="tm-q-delete rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
          onClick={onDelete}
          aria-label="Sil"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      ) : null}

      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-100 px-2 py-1.5 text-[11px]">
        <span className="tm-q-num font-bold text-slate-800">Soru {index + 1})</span>
        <span className="tm-q-meta max-w-[65%] truncate rounded-full bg-white px-2 py-0.5 text-[9px] font-medium text-slate-500 ring-1 ring-slate-200/80">
          {meta}
        </span>
      </div>

      <div className="tm-q-body">
        <div className="tm-q-content flex w-full flex-col justify-start gap-3">
          {hasImage ? (
            <div className="tm-q-img-wrap flex w-full flex-col items-start rounded border border-slate-200 bg-slate-50/80 px-2 py-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={question.imageDataUrl}
                alt=""
                className="tm-q-image my-2 block h-auto w-full object-contain object-top"
              />
            </div>
          ) : (
            <button
              type="button"
              className="tm-q-crop-target flex min-h-[4.5rem] w-full flex-col items-center justify-center rounded border border-dashed border-amber-200/80 bg-slate-50 p-2 text-center text-[10px] font-medium text-slate-500 hover:border-amber-400 hover:bg-amber-50/50"
              onClick={onCropClick}
            >
              <span>PDF önizlemesinden kırpın</span>
              <span className="mt-1 text-[9px] text-slate-400">veya havuzdan seçin</span>
            </button>
          )}
        </div>

        <AnswerChoicePicker
          question={question}
          showChoices={showChoices}
          onAnswer={onAnswer}
        />
      </div>
    </div>
  );
}
