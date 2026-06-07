"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { isRowDirty } from "@/lib/exams/exam-parser";
import type { ParseRow } from "@/lib/exams/types";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 100;

function truncateAnswers(s: string, max = 24) {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}

function rowStatusLabel(r: ParseRow) {
  if (r.issues.includes("duplicate")) return "Mükerrer";
  if (r.issues.includes("no-code")) return "Numara yok";
  if (r.issues.includes("no-book")) return "Kitapçık eksik";
  if (!r.matched) return "Eşleşmedi";
  return "Tamam";
}

export function PreviewTable({
  rows,
  onToggle,
  onMatch,
}: {
  rows: ParseRow[];
  onToggle: (id: string, checked: boolean) => void;
  onMatch: (row: ParseRow) => void;
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [rows.length]);

  const visibleRows = useMemo(() => {
    if (rows.length <= PAGE_SIZE) return rows;
    const start = (page - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, page]);

  const showPager = rows.length > PAGE_SIZE;

  return (
    <div className="space-y-2">
      {showPager && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
          <span>
            {rows.length} satır · sayfa {page}/{totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Önceki
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Sonraki
            </Button>
          </div>
        </div>
      )}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Seç</th>
              <th className="px-3 py-2">Durum</th>
              <th className="px-3 py-2">No</th>
              <th className="px-3 py-2">Ad</th>
              <th className="px-3 py-2">Kitapçık</th>
              <th className="px-3 py-2">Cevaplar</th>
              <th className="px-3 py-2">D</th>
              <th className="px-3 py-2">Y</th>
              <th className="px-3 py-2">B</th>
              <th className="px-3 py-2">Net</th>
              <th className="px-3 py-2">Şube</th>
              <th className="px-3 py-2">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((r) => {
              const dirty = isRowDirty(r);
              return (
                <tr
                  key={r.id}
                  className={cn(
                    "border-t border-slate-50",
                    dirty && "bg-amber-50/60",
                    r.matched && !dirty && "bg-emerald-50/30",
                    r.issues.includes("duplicate") && "bg-orange-50/50"
                  )}
                >
                  <td className="px-3 py-2">
                    <Checkbox
                      checked={r.selected}
                      onCheckedChange={(c) => onToggle(r.id, !!c)}
                    />
                  </td>
                  <td className="px-3 py-2 text-xs font-medium text-slate-700">
                    {rowStatusLabel(r)}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{r.no || "—"}</td>
                  <td className="px-3 py-2">
                    {r.name ? (
                      <div>
                        <span
                          className={cn(
                            !r.matched && "font-semibold text-slate-900"
                          )}
                        >
                          {r.name}
                        </span>
                        {!r.matched && (
                          <span className="mt-0.5 block text-[10px] font-medium text-amber-700">
                            Dosyadan — katalogda eşleşmedi
                          </span>
                        )}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2">{r.book || "—"}</td>
                  <td className="max-w-[120px] truncate px-3 py-2 font-mono text-xs text-slate-600">
                    {truncateAnswers(r.answers) || "—"}
                  </td>
                  <td className="px-3 py-2">{r.correct ?? "—"}</td>
                  <td className="px-3 py-2">{r.wrong ?? "—"}</td>
                  <td className="px-3 py-2">{r.blank ?? "—"}</td>
                  <td className="px-3 py-2 font-semibold">{r.net != null ? r.net : "—"}</td>
                  <td className="px-3 py-2 text-slate-600">{r.sube || "—"}</td>
                  <td className="px-3 py-2">
                    {!r.matched ? (
                      <button
                        type="button"
                        className="text-sm font-medium text-blue-600 hover:underline"
                        onClick={() => onMatch(r)}
                      >
                        Eşleştir
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-700">OK</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
