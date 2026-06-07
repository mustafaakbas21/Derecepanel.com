"use client";

import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Camera, History, Loader2, Plus, Send } from "lucide-react";

import { cn } from "@/lib/utils";

export type OnyxChatInputRef = {
  focus: () => void;
  clear: () => void;
  setDraft: (text: string) => void;
};

function resizeTextarea(el: HTMLTextAreaElement | null): number {
  if (!el) return 0;
  el.style.height = "0px";
  const next = Math.min(el.scrollHeight, 160);
  el.style.height = `${next}px`;
  return next;
}

const SINGLE_LINE_HEIGHT = 44;

export type OnyxChatInputBoxProps = {
  onSubmit: (text: string) => void;
  placeholder: string;
  disabled: boolean;
  hasPendingImage?: boolean;
  isLoading: boolean;
  isQuerying?: boolean;
  inputHighlighted?: boolean;
  onAttachFile?: () => void;
  onHistoryClick?: () => void;
  attachLabel?: string;
  attachIcon?: React.ReactNode;
  variant?: "default" | "pill" | "float";
  /** Gemini tarzı yetenek seçici — input solunda */
  leadingSlot?: React.ReactNode;
};

export const OnyxChatInputBox = memo(
  forwardRef<OnyxChatInputRef, OnyxChatInputBoxProps>(function OnyxChatInputBox(
    {
      onSubmit,
      placeholder,
      disabled,
      hasPendingImage = false,
      isLoading,
      isQuerying = false,
      inputHighlighted = false,
      onAttachFile,
      onHistoryClick,
      attachLabel = "Fotoğraf",
      attachIcon,
      variant = "float",
      leadingSlot,
    },
    ref
  ) {
    const [input, setInput] = useState("");
    const [expanded, setExpanded] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const isFloat = variant === "float";
    const isPill = variant === "pill" || isFloat;

    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus(),
      clear: () => {
        setInput("");
        const height = resizeTextarea(textareaRef.current);
        setExpanded(height > SINGLE_LINE_HEIGHT);
      },
      setDraft: (text: string) => {
        setInput(text);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const height = resizeTextarea(textareaRef.current);
            setExpanded(height > SINGLE_LINE_HEIGHT);
            textareaRef.current?.focus();
          });
        });
      },
    }));

    useEffect(() => {
      const height = resizeTextarea(textareaRef.current);
      setExpanded(height > SINGLE_LINE_HEIGHT);
    }, [input]);

    const handleSubmit = useCallback(() => {
      const text = input.trim();
      if (disabled || isLoading) return;
      if (!text && !hasPendingImage) return;
      onSubmit(text);
      setInput("");
      const height = resizeTextarea(textareaRef.current);
      setExpanded(height > SINGLE_LINE_HEIGHT);
    }, [disabled, hasPendingImage, input, isLoading, onSubmit]);

    const submitDisabled =
      disabled || isLoading || (!input.trim() && !hasPendingImage);

    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className={cn(
          "onyx-composer-form relative flex w-full items-end gap-1 overflow-visible sm:gap-1.5",
          expanded && "onyx-composer-form--expanded",
          isFloat
            ? cn(
                "border border-slate-200/80 bg-white px-2 py-2 shadow-[0_4px_24px_rgba(15,23,42,0.08),0_1px_3px_rgba(15,23,42,0.04)]",
                !expanded && "onyx-composer-form--single",
                isQuerying || inputHighlighted
                  ? "border-amber-300/70 ring-1 ring-amber-200/50"
                  : "focus-within:border-slate-300 focus-within:shadow-[0_8px_32px_rgba(15,23,42,0.1)]"
              )
            : isPill
              ? cn(
                  "border bg-white px-2 py-2 shadow-sm",
                  !expanded && "onyx-composer-form--single",
                  isQuerying || inputHighlighted
                    ? "border-amber-300/80 ring-1 ring-amber-200/60"
                    : "border-slate-200/90 focus-within:border-slate-300 focus-within:ring-1 focus-within:ring-slate-200/80"
                )
              : cn(
                  "gap-2 rounded-2xl border bg-white/90 px-2 py-2 shadow-sm backdrop-blur-sm",
                  isQuerying || inputHighlighted
                    ? "border-amber-300/70 ring-1 ring-amber-200/50"
                    : "border-slate-200/90 focus-within:border-slate-300 focus-within:ring-1 focus-within:ring-slate-200"
                )
        )}
      >
        <div className="onyx-composer-form__leading flex shrink-0 items-end gap-0.5 pb-0.5 sm:gap-1">
          {leadingSlot ? (
            <>
              <div className="onyx-composer-form__picker">{leadingSlot}</div>
              <span
                className="mx-0.5 mb-2 hidden h-5 w-px shrink-0 bg-slate-200/90 sm:block"
                aria-hidden
              />
            </>
          ) : null}

          {onAttachFile ? (
            <button
              type="button"
              disabled={disabled}
              onClick={onAttachFile}
              aria-label={attachLabel}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10"
            >
              {isPill ? (
                <Plus size={20} aria-hidden />
              ) : (
                (attachIcon ?? <Camera size={20} aria-hidden />)
              )}
            </button>
          ) : null}

          {onHistoryClick ? (
            <button
              type="button"
              disabled={disabled}
              onClick={onHistoryClick}
              aria-label="Sohbet geçmişi"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10"
            >
              <History size={18} aria-hidden />
            </button>
          ) : null}
        </div>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          rows={1}
          placeholder={placeholder}
          disabled={disabled}
          aria-label="Onyx mesajı"
          className={cn(
            "onyx-composer-form__textarea max-h-40 min-h-[40px] min-w-0 flex-1 resize-none border-none bg-transparent px-1 py-2 text-[15px] leading-relaxed text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0 disabled:opacity-50",
            expanded && "pt-2 pb-1.5"
          )}
        />

        <button
          type="submit"
          disabled={submitDisabled}
          aria-label="Gönder"
          className={cn(
            "onyx-composer-form__send mb-0.5 flex shrink-0 items-center justify-center rounded-full bg-slate-900 text-white transition-colors hover:bg-slate-800 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40",
            isPill ? "h-9 w-9 sm:h-10 sm:w-10" : "h-10 w-10 rounded-xl"
          )}
        >
          {isLoading ? (
            <Loader2 size={18} className="animate-spin" aria-hidden />
          ) : (
            <Send size={17} className="shrink-0" aria-hidden />
          )}
        </button>
      </form>
    );
  })
);

OnyxChatInputBox.displayName = "OnyxChatInputBox";

export { Camera as OnyxChatInputCameraIcon };
