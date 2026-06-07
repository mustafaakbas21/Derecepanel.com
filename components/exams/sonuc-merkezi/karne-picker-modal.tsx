"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { studentRowKey, subeLabel } from "@/lib/exams/exam-rank";
import type { ExamResultRow, MergedExam } from "@/lib/exams/types";
import { toast } from "@/lib/notify";

import { ModalPortal } from "./modal-portal";
import "./sonuc-merkezi-modals.css";

type KarnePickerModalProps = {
  open: boolean;
  exam: MergedExam | null;
  rows: ExamResultRow[];
  onClose: () => void;
  onGenerate: (selected: ExamResultRow[]) => void;
};

/** Eski #bds-karne-picker */
export function KarnePickerModal({
  open,
  exam,
  rows,
  onClose,
  onGenerate,
}: KarnePickerModalProps) {
  const [search, setSearch] = useState("");
  const [sube, setSube] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setSube("");
    setSelectedKeys(new Set());
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, exam?.id]);

  const subeOptions = useMemo(() => {
    const set = new Set(rows.map((r) => subeLabel(r)));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "tr"));
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (sube && subeLabel(r) !== sube) return false;
      if (!q) return true;
      const hay = `${r.name || ""} ${r.studentName || ""} ${r.studentCode || ""} ${r.studentId || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search, sube]);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((r) => selectedKeys.has(studentRowKey(r)));
  const someFilteredSelected =
    filtered.some((r) => selectedKeys.has(studentRowKey(r))) && !allFilteredSelected;

  const toggleAllFiltered = (on: boolean) => {
    const next = new Set(selectedKeys);
    filtered.forEach((r) => {
      const k = studentRowKey(r);
      if (on) next.add(k);
      else next.delete(k);
    });
    setSelectedKeys(next);
  };

  const toggleOne = (key: string, on: boolean) => {
    const next = new Set(selectedKeys);
    if (on) next.add(key);
    else next.delete(key);
    setSelectedKeys(next);
  };

  const handleGenerate = () => {
    const selected = rows.filter((r) => selectedKeys.has(studentRowKey(r)));
    if (!selected.length) {
      toast.message("En az bir öğrenci seçin.");
      return;
    }
    onGenerate(selected);
  };

  if (!open || !exam) return null;

  const examTitle = exam.name || exam.ad || exam.id;

  return (
    <ModalPortal>
    <div
      id="bds-karne-picker"
      className="sm-modal-root sm-modal-root--picker"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bds-karne-picker-title"
    >
      <button
        type="button"
        className="sm-modal-backdrop"
        data-bds-karne-picker-backdrop
        aria-label="Vazgeç"
        onClick={onClose}
      />
      <div className="sm-modal-panel sm-modal-panel--picker">
        <div className="sm-karne-picker-head">
          <h2 id="bds-karne-picker-title" className="text-base font-extrabold text-slate-900">
            Karne yazdırma
          </h2>
          <p id="bds-karne-picker-sub" className="mt-0.5 text-xs font-medium text-slate-600">
            {examTitle} · {rows.length} kayıt
          </p>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-3 p-4 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Input
                id="bds-karne-picker-search"
                type="search"
                placeholder="Öğrenci ara…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>
            <div className="shrink-0 sm:min-w-[10rem]">
              <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Sınıf / şube
              </span>
              <Select
                value={sube || "__all__"}
                onValueChange={(v) => setSube(v === "__all__" ? "" : v)}
              >
                <SelectTrigger id="bds-karne-picker-sube" className="h-9">
                  <SelectValue placeholder="Tüm sınıflar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Tüm sınıflar</SelectItem>
                  {subeOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 text-sm font-semibold text-slate-800">
            <input
              type="checkbox"
              id="bds-karne-picker-all"
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              checked={allFilteredSelected}
              ref={(el) => {
                if (el) el.indeterminate = someFilteredSelected;
              }}
              onChange={(e) => toggleAllFiltered(e.target.checked)}
            />
            Tümünü seç (filtrelenmiş liste)
          </label>
          <div
            id="bds-karne-picker-list"
            className="sm-karne-picker-list"
            role="listbox"
            aria-label="Sınava giren öğrenciler"
          >
            {!filtered.length ? (
              <p className="px-2 py-6 text-center text-sm text-slate-500">
                Filtreyle eşleşen öğrenci yok.
              </p>
            ) : (
              filtered.map((r) => {
                const key = studentRowKey(r);
                const checked = selectedKeys.has(key);
                return (
                  <label key={key} className="sm-karne-picker-row mb-1 block">
                    <input
                      type="checkbox"
                      className="bds-karne-pick-cb h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      data-bds-key={key}
                      checked={checked}
                      onChange={(e) => toggleOne(key, e.target.checked)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-slate-900">
                        {r.name || r.studentName || "—"}
                      </span>
                      <span className="font-mono text-xs text-slate-500">
                        {r.studentCode || r.studentId || "—"} · {subeLabel(r)}
                      </span>
                    </span>
                  </label>
                );
              })
            )}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <Button type="button" id="bds-karne-picker-cancel" variant="outline" onClick={onClose}>
              Vazgeç
            </Button>
            <Button type="button" id="bds-karne-picker-generate" variant="primary" onClick={handleGenerate}>
              <span aria-hidden="true" className="mr-1">
                🖨️
              </span>
              Seçilenlerin karnesini üret
            </Button>
          </div>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
