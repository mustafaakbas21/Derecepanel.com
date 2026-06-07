"use client";

import type { CropAnswerChoice } from "@/lib/test-maker/types";
import { cn } from "@/lib/utils";

const LETTERS: CropAnswerChoice[] = ["A", "B", "C", "D", "E", "blank"];

export type CropChoiceBarMode = "idle" | "crop" | "image";

type CropChoiceBarProps = {
  mode: CropChoiceBarMode;
  selectedLetter: CropAnswerChoice | null;
  previewDataUrl?: string | null;
  onSelectLetter: (letter: CropAnswerChoice) => void;
  onConfirm: () => void;
  onCancel?: () => void;
  /** Görsel kaynağı kutusu içinde — üst kenarlık yok */
  embedded?: boolean;
};

function choiceLabel(letter: CropAnswerChoice) {
  return letter === "blank" ? "Boş" : letter;
}

function modeHint(mode: CropChoiceBarMode, embedded?: boolean) {
  if (mode === "crop") return "Kırpılan alan — doğru şıkkı seçin";
  if (mode === "image") return "Görsel — doğru şıkkı seçin";
  if (embedded) return "Görsel soru ekleme";
  return "PDF üzerinde alan kırpın";
}

function idleHint(mode: CropChoiceBarMode, embedded?: boolean) {
  if (mode === "image" || embedded) return "Görsel yükleyin, ardından şık seçin";
  return "Kırp modunda alan seçince burada görünür";
}

/** Önizleme kutusunun altında sabit şık seçim çubuğu */
export function CropChoiceBar({
  mode,
  selectedLetter,
  previewDataUrl,
  onSelectLetter,
  onConfirm,
  onCancel,
  embedded = false,
}: CropChoiceBarProps) {
  const active = mode !== "idle";
  const confirmLabel = mode === "image" ? "Soru ekle" : "Tamam";
  const showPreview = Boolean(previewDataUrl) && (mode === "crop" || mode === "image");

  return (
    <section
      id={embedded ? "tm-image-crop-choice-bar" : "tm-crop-choice-bar"}
      className={cn(
        "tm-crop-choice-bar shrink-0 px-3 py-3",
        !embedded && "border-t border-slate-100 bg-slate-50/60",
        embedded && "border-t border-slate-100 bg-white",
        active && "tm-crop-choice-bar--active",
        embedded && active && "bg-emerald-50/30"
      )}
      aria-label={embedded ? "Görsel şık seçimi" : "PDF kırpma şık seçimi"}
    >
      <div className="mb-2.5 flex items-start gap-3">
        <div
          className={cn(
            "tm-crop-choice-bar__preview shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm",
            showPreview ? "block" : "hidden"
          )}
        >
          {showPreview ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={previewDataUrl ?? undefined}
              alt=""
              className="h-16 w-24 object-contain object-center p-1"
            />
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-[10px] font-semibold uppercase tracking-[0.06em]",
              active ? (embedded ? "text-emerald-800" : "text-amber-800") : "text-slate-400"
            )}
          >
            {modeHint(mode, embedded)}
          </p>
          {!active ? (
            <p className="mt-0.5 text-[11px] text-slate-400">{idleHint(mode, embedded)}</p>
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          "flex flex-wrap items-center gap-2",
          !active && "pointer-events-none opacity-45"
        )}
      >
        <div
          className="tm-crop-choice-bar__letters flex flex-wrap gap-1"
          role="group"
          aria-label="Şıklar"
        >
          {LETTERS.map((L) => (
            <button
              key={L}
              type="button"
              className={cn(
                "tm-crop-choice-bar__letter rounded-full border px-0 text-center text-[12px] font-bold transition",
                L === "blank" ? "min-w-[2.75rem] px-2.5 py-1.5 text-[11px]" : "h-[2.125rem] w-[2.125rem]",
                selectedLetter === L && "is-selected"
              )}
              data-letter={L}
              aria-pressed={selectedLetter === L}
              disabled={!active}
              onClick={() => onSelectLetter(L)}
            >
              {choiceLabel(L)}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          {onCancel ? (
            <button
              type="button"
              className="tm-crop-choice-bar__cancel rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold"
              disabled={!active}
              onClick={onCancel}
            >
              İptal
            </button>
          ) : null}
          <button
            type="button"
            id={embedded ? "tm-image-crop-ok" : "tm-pdf-crop-ok"}
            disabled={!active || !selectedLetter}
            className="tm-crop-choice-bar__ok rounded-lg px-4 py-1.5 text-[12px] font-bold disabled:cursor-not-allowed disabled:opacity-40"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </section>
  );
}
