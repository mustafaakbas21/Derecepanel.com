"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, Users } from "lucide-react";

import { getInitials } from "@/lib/students/constants";
import type { StudentRecord } from "@/lib/students/types";
import { cn } from "@/lib/utils";

export function StudentPicker({
  students,
  value,
  onChange,
}: {
  students: StudentRecord[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const selected = students.find((s) => s.ogrenciId === value);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.studentCode.toLowerCase().includes(q) ||
        (s.goal ?? "").toLowerCase().includes(q)
    );
  }, [students, query]);

  const pick = (id: string) => {
    onChange(id);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 rounded-xl border bg-white px-3.5 text-sm shadow-sm transition",
          open ? "border-slate-400 ring-2 ring-slate-200" : "border-slate-200 hover:border-slate-300"
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Users className="h-4 w-4 shrink-0 text-slate-400" />
          {selected ? (
            <span className="truncate text-slate-900">
              {selected.name}
              <span className="ml-1 font-mono text-xs text-slate-400">
                {selected.studentCode}
              </span>
            </span>
          ) : (
            <span className="text-slate-400">Öğrenci seçin…</span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-slate-400 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="relative border-b border-slate-100 p-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ad veya öğrenci kodu ara…"
              aria-label="Öğrenci ara"
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/60 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="max-h-64 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-slate-400">
                Sonuç bulunamadı
              </p>
            ) : (
              filtered.map((s) => {
                const active = s.ogrenciId === value;
                return (
                  <button
                    key={s.ogrenciId}
                    type="button"
                    onClick={() => pick(s.ogrenciId)}
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
                        {s.name}
                      </span>
                      <span className="block truncate font-mono text-[11px] text-slate-400">
                        {s.studentCode}
                      </span>
                    </span>
                    {active && <Check className="h-4 w-4 shrink-0 text-slate-900" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
