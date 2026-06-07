"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

function buildPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 1) return total === 1 ? [1] : [];
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "ellipsis")[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i]!;
    const prev = sorted[i - 1];
    if (prev != null && p - prev > 1) out.push("ellipsis");
    out.push(p);
  }

  return out;
}

type Props = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  disabled?: boolean;
  onPageChange: (page: number) => void;
};

export function TercihPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  disabled = false,
  onPageChange,
}: Props) {
  if (totalItems === 0) return null;

  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);
  const pageNumbers = buildPageNumbers(currentPage, totalPages);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 bg-gradient-to-b from-slate-50/80 to-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="text-sm text-slate-600">
        <span className="font-semibold tabular-nums text-slate-900">
          {start.toLocaleString("tr-TR")}–{end.toLocaleString("tr-TR")}
        </span>
        <span className="text-slate-400"> / </span>
        <span className="tabular-nums">{totalItems.toLocaleString("tr-TR")}</span>
        <span className="mx-2 hidden text-slate-300 sm:inline">·</span>
        <span className="hidden sm:inline">
          Sayfa{" "}
          <span className="font-semibold tabular-nums text-slate-900">
            {currentPage}/{totalPages}
          </span>
        </span>
      </p>

      <nav
        className="flex flex-wrap items-center justify-center gap-1"
        aria-label="Sayfa navigasyonu"
      >
        <button
          type="button"
          disabled={disabled || currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className={cn(
            "inline-flex h-9 items-center gap-1 rounded-lg border px-3 text-sm font-medium transition-colors",
            disabled || currentPage <= 1
              ? "cursor-not-allowed border-slate-200 text-slate-300"
              : "border-slate-300 bg-white text-slate-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-800"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Önceki</span>
        </button>

        {pageNumbers.map((item, idx) =>
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${idx}`}
              className="flex h-9 w-9 items-center justify-center text-sm text-slate-400"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              disabled={disabled}
              aria-current={item === currentPage ? "page" : undefined}
              onClick={() => onPageChange(item)}
              className={cn(
                "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2.5 text-sm font-semibold tabular-nums transition-colors",
                item === currentPage
                  ? "border-orange-600 bg-orange-600 text-white shadow-sm"
                  : disabled
                    ? "cursor-not-allowed border-slate-200 text-slate-300"
                    : "border-slate-200 bg-white text-slate-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-800"
              )}
            >
              {item}
            </button>
          )
        )}

        <button
          type="button"
          disabled={disabled || currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className={cn(
            "inline-flex h-9 items-center gap-1 rounded-lg border px-3 text-sm font-medium transition-colors",
            disabled || currentPage >= totalPages
              ? "cursor-not-allowed border-slate-200 text-slate-300"
              : "border-slate-300 bg-white text-slate-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-800"
          )}
        >
          <span className="hidden sm:inline">Sonraki</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </nav>
    </div>
  );
}
