"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";

import { cn } from "@/lib/utils";

export type AtlasPickerOption = {
  value: string;
  label: string;
  meta?: string;
};

type Props = {
  label: string;
  options: AtlasPickerOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  emptyHint?: string;
};

type PopoverPos = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

export function AtlasSinglePicker({
  label,
  options,
  value,
  onChange,
  placeholder = "Seçin…",
  disabled = false,
  loading = false,
  emptyHint = "Sonuç yok",
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [q, setQ] = useState("");
  const [pos, setPos] = useState<PopoverPos | null>(null);

  useEffect(() => setMounted(true), []);

  const updatePosition = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gap = 4;
    const spaceBelow = window.innerHeight - rect.bottom - gap - 16;
    const spaceAbove = rect.top - gap - 16;
    const openUp = spaceBelow < 200 && spaceAbove > spaceBelow;
    const maxHeight = Math.min(320, Math.max(160, openUp ? spaceAbove : spaceBelow));

    setPos({
      left: rect.left,
      width: rect.width,
      top: openUp ? rect.top - gap - maxHeight : rect.bottom + gap,
      maxHeight,
    });
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setQ("");
      setPos(null);
      return;
    }
    updatePosition();
    const t = window.setTimeout(() => searchRef.current?.focus(), 0);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t)) return;
      if (popoverRef.current?.contains(t)) return;
      setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDoc);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDoc);
    };
  }, [isOpen]);

  const selectedOption = useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value]
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase("tr-TR");
    if (!needle) return options;
    return options.filter(
      (o) =>
        o.label.toLocaleLowerCase("tr-TR").includes(needle) ||
        o.value.toLocaleLowerCase("tr-TR").includes(needle) ||
        (o.meta?.toLocaleLowerCase("tr-TR").includes(needle) ?? false)
    );
  }, [options, q]);

  const summary =
    value && selectedOption
      ? selectedOption.meta
        ? `${selectedOption.label} · ${selectedOption.meta}`
        : selectedOption.label
      : loading
        ? "Yükleniyor…"
        : placeholder;

  const pick = (next: string) => {
    onChange(next);
    setIsOpen(false);
    setQ("");
  };

  const openPicker = () => {
    if (disabled) return;
    setIsOpen(true);
  };

  const popoverId = `atlas-picker-popover-${label.replace(/\s+/g, "-")}`;

  const listPopover =
    mounted && isOpen && !disabled && pos
      ? createPortal(
          <div
            ref={popoverRef}
            id={popoverId}
            role="listbox"
            aria-label={`${label} seçenekleri`}
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: pos.width,
              maxHeight: pos.maxHeight,
              zIndex: 9999,
            }}
            className="pointer-events-auto flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl ring-1 ring-slate-900/5"
          >
            <div
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5"
              style={{ maxHeight: pos.maxHeight - 36 }}
            >
              {filtered.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-slate-500">{emptyHint}</p>
              ) : (
                <div className="space-y-0.5">
                  {filtered.map((opt) => {
                    const on = opt.value === value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="option"
                        aria-selected={on}
                        onClick={() => pick(opt.value)}
                        className={cn(
                          "flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                          on ? "bg-slate-900/5 ring-1 ring-slate-900/10" : "hover:bg-slate-50"
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                            on
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-300 bg-white"
                          )}
                        >
                          {on ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm leading-snug text-slate-800">
                            {opt.label}
                          </span>
                          {opt.meta ? (
                            <span className="mt-0.5 block text-[11px] text-slate-500">
                              {opt.meta}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="shrink-0 border-t border-slate-100 bg-slate-50/80 px-3 py-2 text-[11px] text-slate-500">
              {filtered.length} sonuç{q.trim() ? ` · “${q.trim()}”` : ""}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div ref={rootRef} className="relative">
        <div
          className={cn(
            "rounded-xl border bg-white transition-colors",
            disabled && "cursor-not-allowed opacity-60",
            isOpen || value
              ? "border-slate-900/30 ring-1 ring-slate-900/10"
              : "border-slate-200 hover:border-slate-300"
          )}
        >
          <span className="block px-3 pt-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
            {label}
          </span>

          {isOpen ? (
            <div className="relative flex items-center gap-2 px-3 pb-2.5 pt-1">
              <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              <input
                ref={searchRef}
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={`${label} ara…`}
                aria-label={`${label} ara`}
                autoComplete="off"
                className="min-w-0 flex-1 border-0 bg-transparent py-1 text-sm font-medium text-slate-800 outline-none placeholder:font-normal placeholder:text-slate-400"
              />
              <button
                type="button"
                className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Listeyi kapat"
                onClick={() => setIsOpen(false)}
              >
                <ChevronDown className="h-4 w-4 rotate-180" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={disabled}
              aria-expanded={false}
              aria-haspopup="listbox"
              className="flex w-full items-center justify-between gap-2 px-3 pb-2.5 pt-1 text-left"
              onClick={openPicker}
            >
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-sm font-medium",
                  value ? "text-slate-800" : "text-slate-500"
                )}
              >
                {summary}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
            </button>
          )}
        </div>
      </div>
      {listPopover}
    </>
  );
}
