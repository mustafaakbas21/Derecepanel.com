"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, UserRound } from "lucide-react";

import { studentDisplayName, studentSelectValue } from "@/lib/onyx/coach-students";
import { getInitials } from "@/lib/students/constants";
import type { StudentRecord } from "@/lib/students/types";
import { cn } from "@/lib/utils";

const EMPTY_VALUE = "";

type Props = {
  students: StudentRecord[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  studentsReady?: boolean;
};

export function OnyxToolbarStudentSelect({
  students,
  value,
  onChange,
  disabled,
  studentsReady = true,
}: Props) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(
    () => students.find((s) => studentSelectValue(s) === value),
    [students, value]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      const name = s.name?.toLowerCase() ?? "";
      const code = s.studentCode?.toLowerCase() ?? "";
      const id = String(s.ogrenciId ?? "").toLowerCase();
      return name.includes(q) || code.includes(q) || id.includes(q);
    });
  }, [students, query]);

  const triggerLabel = useMemo(() => {
    if (!studentsReady) return "Yükleniyor…";
    if (students.length === 0) return "Öğrenci yok";
    if (!value.trim()) return "Öğrenci seçili değil";
    if (selected) return studentDisplayName(selected);
    return "Öğrenci seçili değil";
  }, [studentsReady, students.length, value, selected]);

  const isEmptySelection = !value.trim();
  const triggerMuted =
    !studentsReady || students.length === 0 || isEmptySelection;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (id: string) => {
    onChange(id);
    setOpen(false);
    setQuery("");
  };

  const toggleOpen = () => {
    if (disabled || !studentsReady || students.length === 0) return;
    setOpen((o) => !o);
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        id={`${listId}-trigger`}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={`${listId}-list`}
        aria-label="Aktif öğrenci"
        onClick={toggleOpen}
        className={cn(
          "onyx-toolbar-btn onyx-toolbar-btn--outline h-9 max-w-[min(100%,12rem)] gap-1.5 px-3 sm:max-w-[14rem]",
          open && "onyx-toolbar-btn--active",
          (disabled || !studentsReady) && "pointer-events-none opacity-50"
        )}
      >
        <UserRound
          size={16}
          strokeWidth={1.75}
          className="shrink-0 text-slate-500"
          aria-hidden
        />
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-left text-[13px] font-medium",
            triggerMuted ? "text-slate-400" : "text-slate-800"
          )}
        >
          {triggerLabel}
        </span>
        <ChevronDown
          size={16}
          strokeWidth={1.75}
          className={cn(
            "shrink-0 text-slate-400 transition-transform",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {open && studentsReady && students.length > 0 ? (
        <div
          className="absolute left-0 top-full z-50 mt-1.5 w-[min(100vw-2rem,18rem)] overflow-hidden rounded-xl border border-slate-200/95 bg-white shadow-lg"
          role="presentation"
        >
          <div className="relative border-b border-slate-100 p-2">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              type="search"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Öğrenci ara…"
              aria-label="Öğrenci ara"
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/60 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <ul
            id={`${listId}-list`}
            role="listbox"
            className="max-h-64 overflow-y-auto p-1"
          >
            <li role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={isEmptySelection}
                onClick={() => pick(EMPTY_VALUE)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition",
                  isEmptySelection
                    ? "bg-slate-900/[0.04] text-slate-600"
                    : "text-slate-500 hover:bg-slate-50"
                )}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-slate-400">
                  <UserRound className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 font-medium">Öğrenci seçili değil</span>
                {isEmptySelection ? (
                  <Check className="h-4 w-4 shrink-0 text-slate-900" aria-hidden />
                ) : null}
              </button>
            </li>

            {filtered.length === 0 ? (
              <li className="px-3 py-5 text-center text-sm text-slate-400" role="presentation">
                Sonuç bulunamadı
              </li>
            ) : (
              filtered.map((s) => {
                const id = studentSelectValue(s);
                const active = id === value;
                return (
                  <li key={id} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => pick(id)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition",
                        active ? "bg-slate-900/[0.04]" : "hover:bg-slate-50"
                      )}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-[11px] font-bold text-white">
                        {getInitials(s.name)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-900">
                          {studentDisplayName(s)}
                        </span>
                        {s.studentCode ? (
                          <span className="block truncate font-mono text-[11px] text-slate-400">
                            {s.studentCode}
                          </span>
                        ) : null}
                      </span>
                      {active ? (
                        <Check className="h-4 w-4 shrink-0 text-slate-900" aria-hidden />
                      ) : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
