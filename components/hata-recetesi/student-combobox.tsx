"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, User } from "lucide-react";

import { loadStudentRows } from "@/lib/hata-recetesi/students";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (canonical: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function StudentCombobox({
  value,
  onChange,
  placeholder = "Öğrenci ara veya seç…",
  disabled,
  className,
}: Props) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const rows = useMemo(() => loadStudentRows(), []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) => r.needle.includes(needle));
  }, [rows, q]);

  const selectedLabel = rows.find((r) => r.canonical === value)?.label ?? value;

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <button
        type="button"
        id={`${listId}-trigger`}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={`${listId}-list`}
        className={cn(
          "hr-combo-trigger",
          open && "hr-combo-trigger--open",
          disabled && "pointer-events-none opacity-50"
        )}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="flex min-w-0 items-center gap-2">
          <User className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
          <span className={cn("truncate", !value && "text-slate-400")}>
            {value ? selectedLabel : placeholder}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-slate-400 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && !disabled ? (
        <div className="hr-combo-menu">
          <input
            type="search"
            className="hr-combo-search"
            placeholder="Ad veya kod…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
          />
          <ul id={`${listId}-list`} role="listbox" className="hr-combo-list">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-500">Sonuç yok</li>
            ) : (
              filtered.map((r) => (
                <li key={r.canonical} role="option" aria-selected={value === r.canonical}>
                  <button
                    type="button"
                    className={cn(
                      "hr-combo-option",
                      value === r.canonical && "hr-combo-option--active"
                    )}
                    onClick={() => {
                      onChange(r.canonical);
                      setOpen(false);
                      setQ("");
                    }}
                  >
                    {r.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
