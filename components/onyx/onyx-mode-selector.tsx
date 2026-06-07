"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Sparkles } from "lucide-react";

import {
  ONYX_MODE_OPTIONS,
  type OnyxModeOption,
} from "@/lib/onyx/mode-selector";
import { cn } from "@/lib/utils";

type OnyxModeSelectorProps = {
  disabled?: boolean;
  selectedMode: string;
  onSelectMode: (mode: OnyxModeOption) => void;
  className?: string;
};

export function OnyxModeSelector({
  disabled = false,
  selectedMode,
  onSelectMode,
  className,
}: OnyxModeSelectorProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  const handleSelect = useCallback(
    (mode: OnyxModeOption) => {
      setOpen(false);
      onSelectMode(mode);
    },
    [onSelectMode]
  );

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Onyx yetenek modu seç"
        className={cn(
          "inline-flex h-10 max-w-[min(100%,240px)] items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm transition-all",
          "hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300",
          "disabled:cursor-not-allowed disabled:opacity-50",
          open && "border-slate-300 bg-slate-50 ring-2 ring-slate-200/80"
        )}
      >
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden />
        <span className="truncate">{selectedMode}</span>
        <ChevronDown
          size={14}
          className={cn(
            "h-4 w-4 shrink-0 text-slate-400 transition-transform",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label="Onyx modları"
          className="absolute bottom-full left-0 z-50 mb-2 w-[min(100vw-2rem,320px)] overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 p-1.5 shadow-xl shadow-slate-200/60 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <div className="border-b border-slate-100 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Yetenek Modu
            </p>
            <p className="text-xs text-slate-500">
              GPT / Gemini model seçici gibi — modu seç, Onyx hemen devreye girer.
            </p>
          </div>
          <ul className="max-h-[min(60vh,320px)] overflow-y-auto py-1">
            {ONYX_MODE_OPTIONS.map((mode) => {
              const selected = mode.label === selectedMode;
              return (
                <li key={mode.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => handleSelect(mode)}
                    className={cn(
                      "flex w-full cursor-pointer items-start gap-2 rounded-xl px-3 py-2.5 text-left transition-colors",
                      "hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:outline-none",
                      selected && "bg-slate-100"
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-slate-800">
                        {mode.label}
                      </span>
                      <span className="mt-0.5 block text-xs leading-snug text-slate-500">
                        {mode.description}
                      </span>
                    </span>
                    {selected ? (
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                        aria-hidden
                      />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
