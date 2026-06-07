"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search, UserRound, X } from "lucide-react";

import { FIELD_LABELS } from "@/lib/students/constants";
import { normalizeStudyField } from "@/lib/students/normalize-field";
import type { StudentRecord } from "@/lib/students/types";
import { cn } from "@/lib/utils";

type Props = {
  students: StudentRecord[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export function StudentPickerBar({ students, selectedId, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const selected = useMemo(
    () => students.find((s) => s.ogrenciId === selectedId) ?? null,
    [students, selectedId]
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase("tr-TR");
    const list = [...students].sort((a, b) => a.name.localeCompare(b.name, "tr-TR"));
    if (!needle) return list;
    return list.filter((s) => {
      const hay = [
        s.name,
        s.studentCode,
        s.sinifBranch,
        FIELD_LABELS[normalizeStudyField(s.alan)],
        s.goal,
      ]
        .join(" ")
        .toLocaleLowerCase("tr-TR");
      return hay.includes(needle);
    });
  }, [students, q]);

  return (
    <div className="relative w-full max-w-xl">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-3 rounded-2xl border bg-white px-4 py-3 text-left shadow-sm transition",
          open ? "border-slate-900/25 ring-2 ring-slate-900/10" : "border-slate-200 hover:border-slate-300"
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <UserRound className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Öğrenci
          </span>
          {selected ? (
            <>
              <span className="block truncate text-sm font-bold text-slate-900">{selected.name}</span>
              <span className="block truncate text-xs text-slate-500">
                {selected.sinifBranch} · {FIELD_LABELS[normalizeStudyField(selected.alan)]}
                {selected.goal ? ` · ${selected.goal}` : ""}
              </span>
            </>
          ) : (
            <span className="block text-sm text-slate-500">Öğrenci seçin…</span>
          )}
        </span>
        <ChevronDown
          className={cn("h-5 w-5 shrink-0 text-slate-400 transition", open && "rotate-180")}
        />
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-30 cursor-default"
            aria-label="Kapat"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
            role="listbox"
          >
            <div className="border-b border-slate-100 p-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Ad, kod, sınıf veya alan ara…"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-9 text-sm outline-none focus:border-slate-400 focus:bg-white"
                  autoFocus
                />
                {q ? (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                    onClick={() => setQ("")}
                    aria-label="Aramayı temizle"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              <p className="mt-2 px-1 text-[11px] text-slate-500">
                {filtered.length} / {students.length} öğrenci
              </p>
            </div>
            <ul className="max-h-[min(50vh,320px)] overflow-y-auto p-1.5">
              {filtered.length === 0 ? (
                <li className="px-3 py-8 text-center text-sm text-slate-500">Eşleşen öğrenci yok</li>
              ) : (
                filtered.map((s) => {
                  const on = s.ogrenciId === selectedId;
                  return (
                    <li key={s.ogrenciId}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={on}
                        className={cn(
                          "flex w-full flex-col rounded-xl px-3 py-2.5 text-left transition",
                          on ? "bg-slate-900 text-white" : "hover:bg-slate-50"
                        )}
                        onClick={() => {
                          onSelect(s.ogrenciId);
                          setOpen(false);
                          setQ("");
                        }}
                      >
                        <span className="text-sm font-semibold">{s.name}</span>
                        <span
                          className={cn(
                            "text-xs",
                            on ? "text-slate-300" : "text-slate-500"
                          )}
                        >
                          {s.sinifBranch} · {FIELD_LABELS[normalizeStudyField(s.alan)]}
                          {s.studentCode ? ` · ${s.studentCode}` : ""}
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
