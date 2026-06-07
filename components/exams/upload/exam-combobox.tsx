"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, Check, ChevronDown, ClipboardList, Search } from "lucide-react";

import { formatTrDate } from "@/lib/exams/exam-storage";
import type { KurumDeneme } from "@/lib/exams/types";
import { cn } from "@/lib/utils";

export type ExamPickerOption = {
  id: string;
  name: string;
  date?: string;
  scope: "kurumsal" | "global";
};

type ExamBuckets = {
  kurumsal: KurumDeneme[];
  global: KurumDeneme[];
};

type ExamOption = {
  id: string;
  label: string;
  dateLabel: string;
  group: "kurumsal" | "global";
  groupLabel: string;
  needle: string;
};

type MenuLayout = {
  left: number;
  width: number;
  maxHeight: number;
  top?: number;
  bottom?: number;
};

type ExamComboboxProps = {
  value: string;
  onValueChange: (examId: string) => void;
  buckets?: ExamBuckets;
  exams?: ExamPickerOption[];
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  triggerId?: string;
};

function computeMenuLayout(trigger: HTMLButtonElement): MenuLayout {
  const rect = trigger.getBoundingClientRect();
  const gap = 6;
  const viewportPadding = 12;
  const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
  const spaceAbove = rect.top - viewportPadding;
  const openUp = spaceBelow < 220 && spaceAbove > spaceBelow;
  const maxHeight = Math.max(160, Math.min(320, openUp ? spaceAbove - gap : spaceBelow - gap));

  if (openUp) {
    return {
      left: rect.left,
      width: rect.width,
      maxHeight,
      bottom: window.innerHeight - rect.top + gap,
    };
  }

  return {
    left: rect.left,
    width: rect.width,
    maxHeight,
    top: rect.bottom + gap,
  };
}

function buildOptionsFromPickerList(exams: ExamPickerOption[]): ExamOption[] {
  return exams.map((ex) => {
    const dateLabel = ex.date ? formatTrDate(ex.date) : "";
    const label = ex.name || ex.id;
    return {
      id: ex.id,
      label,
      dateLabel,
      group: ex.scope,
      groupLabel: ex.scope === "global" ? "Global Denemeler" : "Kurumsal Denemeler",
      needle: [label, dateLabel, ex.date ?? "", ex.id].join(" ").toLowerCase(),
    };
  });
}

function buildExamOptions(buckets: ExamBuckets): ExamOption[] {
  const kurumsal = buckets.kurumsal.map((ex) => {
    const dateLabel = formatTrDate(ex.tarih);
    const label = ex.ad || ex.id;
    return {
      id: ex.id,
      label,
      dateLabel,
      group: "kurumsal" as const,
      groupLabel: "Kurumsal Denemeler",
      needle: [label, dateLabel, ex.tarih, ex.sinav, ex.id].join(" ").toLowerCase(),
    };
  });

  const global = buckets.global.map((ex) => {
    const dateLabel = formatTrDate(ex.tarih);
    const label = ex.ad || ex.id;
    return {
      id: ex.id,
      label,
      dateLabel,
      group: "global" as const,
      groupLabel: "Global Denemeler",
      needle: [label, dateLabel, ex.tarih, ex.sinav, ex.id].join(" ").toLowerCase(),
    };
  });

  return [...kurumsal, ...global];
}

export function ExamCombobox({
  value,
  onValueChange,
  buckets,
  exams,
  disabled,
  placeholder = "Deneme seçin",
  className,
  triggerId,
}: ExamComboboxProps) {
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menuLayout, setMenuLayout] = useState<MenuLayout | null>(null);

  const options = useMemo(() => {
    if (exams?.length) return buildOptionsFromPickerList(exams);
    return buildExamOptions(buckets ?? { kurumsal: [], global: [] });
  }, [buckets, exams]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((opt) => opt.needle.includes(needle));
  }, [options, query]);

  const selected = options.find((opt) => opt.id === value) ?? null;

  const grouped = useMemo(() => {
    const groups: { key: "kurumsal" | "global"; label: string; items: ExamOption[] }[] = [];
    const kurumsal = filtered.filter((o) => o.group === "kurumsal");
    const global = filtered.filter((o) => o.group === "global");
    if (kurumsal.length) groups.push({ key: "kurumsal", label: "Kurumsal Denemeler", items: kurumsal });
    if (global.length) groups.push({ key: "global", label: "Global Denemeler", items: global });
    return groups;
  }, [filtered]);

  const updateMenuLayout = () => {
    if (!triggerRef.current) return;
    setMenuLayout(computeMenuLayout(triggerRef.current));
  };

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (wrapRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
      setQuery("");
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setMenuLayout(null);
      return;
    }
    updateMenuLayout();
    const onLayout = () => updateMenuLayout();
    window.addEventListener("resize", onLayout);
    window.addEventListener("scroll", onLayout, true);
    return () => {
      window.removeEventListener("resize", onLayout);
      window.removeEventListener("scroll", onLayout, true);
    };
  }, [open]);

  const menu =
    open && !disabled && menuLayout && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={menuRef}
            className="fixed z-[200] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
            style={{
              top: menuLayout.top,
              bottom: menuLayout.bottom,
              left: menuLayout.left,
              width: menuLayout.width,
              maxHeight: menuLayout.maxHeight,
            }}
          >
            <div className="border-b border-slate-100 p-2">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <input
                  type="search"
                  className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-200 focus-visible:outline-none"
                  placeholder="Deneme adı veya tarih ara…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                />
              </div>
              <p className="mt-1.5 px-1 text-[11px] text-slate-500">
                {filtered.length} / {options.length} deneme
              </p>
            </div>

            <ul
              id={`${listId}-list`}
              role="listbox"
              className="overflow-y-auto p-1"
              style={{ maxHeight: Math.max(120, menuLayout.maxHeight - 88) }}
            >
              {filtered.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-slate-500">
                  Eşleşen deneme bulunamadı
                </li>
              ) : (
                grouped.map((group) => (
                  <li key={group.key}>
                    <p className="px-2 py-1.5 text-xs font-semibold text-slate-500">
                      {group.label}
                    </p>
                    <ul>
                      {group.items.map((opt) => {
                        const active = value === opt.id;
                        return (
                          <li key={opt.id} role="option" aria-selected={active}>
                            <button
                              type="button"
                              className={cn(
                                "flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-sm transition hover:bg-slate-100",
                                active && "bg-slate-100"
                              )}
                              onClick={() => {
                                onValueChange(opt.id);
                                setOpen(false);
                                setQuery("");
                              }}
                            >
                              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                                {active ? (
                                  <Check className="h-4 w-4 text-slate-900" aria-hidden />
                                ) : null}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-medium text-slate-900">
                                  {opt.label}
                                </span>
                                {opt.dateLabel ? (
                                  <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                                    <CalendarDays className="h-3 w-3 shrink-0" aria-hidden />
                                    {opt.dateLabel}
                                  </span>
                                ) : null}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                ))
              )}
            </ul>
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        id={triggerId ?? `${listId}-trigger`}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={`${listId}-list`}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-sm transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          open && "border-slate-300 ring-2 ring-slate-200"
        )}
        onClick={() => {
          if (disabled) return;
          setOpen((prev) => !prev);
        }}
      >
        <span className="flex min-w-0 items-center gap-2">
          <ClipboardList className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
          {selected ? (
            <span className="truncate">
              <span className="font-medium">{selected.label}</span>
              {selected.dateLabel ? (
                <span className="text-slate-500"> ({selected.dateLabel})</span>
              ) : null}
            </span>
          ) : (
            <span className="truncate text-slate-400">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-slate-400 transition-transform",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {menu}
    </div>
  );
}
