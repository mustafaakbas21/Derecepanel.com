"use client";

import { GripVertical, Trash2 } from "lucide-react";

import type { AnswerLetter, TMConfig, TMQuestion } from "@/lib/test-maker/types";
import { cn } from "@/lib/utils";

const LETTERS: AnswerLetter[] = ["A", "B", "C", "D", "E"];

type QuestionItemProps = {
  question: TMQuestion;
  index: number;
  config: TMConfig;
  showChoices: boolean;
  onAnswer: (letter: AnswerLetter) => void;
  onDelete: () => void;
  onCropClick?: () => void;
};

export function QuestionItem({
  question,
  index,
  config,
  showChoices,
  onAnswer,
  onDelete,
  onCropClick,
}: QuestionItemProps) {
  const meta = [config.dersLabel, config.konuLabel].filter(Boolean).join(" — ");
  const hasImage = Boolean(question.imageDataUrl);

  return (
    <div
      className="tm-q-item group relative flex h-fit w-full flex-col overflow-hidden break-inside-avoid rounded-lg border border-transparent transition-all hover:border-slate-200 hover:shadow-sm"
      data-q-id={question.id}
      data-order={index + 1}
      data-correct={question.answer ?? ""}
      data-cropped={hasImage ? "1" : "0"}
    >
      <div className="teacher-only-ui absolute right-2 top-2 z-10 hidden items-center gap-1 rounded-md border border-slate-100 bg-white/95 p-0.5 shadow-sm group-hover:flex">
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

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-t-md border border-b-0 border-slate-200 bg-slate-100 px-2 py-1.5 text-[11px]">
        <span className="tm-q-num font-bold text-slate-800">Soru {index + 1})</span>
        <span className="tm-q-meta max-w-[65%] truncate rounded-full bg-white px-2 py-0.5 text-[9px] font-medium text-slate-500 ring-1 ring-slate-200/80">
          {meta}
        </span>
      </div>

      <div className="flex h-fit flex-col overflow-visible rounded-b-md border border-slate-200 bg-white p-2">
        {hasImage ? (
          <div className="tm-q-img-wrap flex w-full shrink-0 flex-col items-start overflow-visible rounded border border-slate-200 bg-slate-50/80 px-2 py-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={question.imageDataUrl}
              alt=""
              className="tm-q-image block h-auto w-full max-w-full object-contain object-left"
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

        {hasImage && showChoices && (
          <div className="teacher-only-ui tm-q-choices">
            <p className="mb-1.5 text-[10px] font-semibold text-slate-600">
              Doğru şık — cevap anahtarına yazılır
            </p>
            <div className="flex flex-wrap gap-1" role="group" aria-label="Doğru şık">
              {LETTERS.map((L) => (
                <button
                  key={L}
                  type="button"
                  className={cn(
                    "tm-q-opt",
                    question.answer === L && "is-selected"
                  )}
                  data-letter={L}
                  aria-pressed={question.answer === L}
                  onClick={() => onAnswer(L)}
                >
                  {L}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
