"use client";

import { useMemo } from "react";

import { cn } from "@/lib/utils";

const CHOICES = ["A", "B", "C", "D", "E"] as const;
const QUESTIONS_PER_COLUMN = 40;

type OptikFormProps = {
  totalQuestions: number;
  dersLabel?: string;
  kurum?: string;
  className?: string;
};

type OptikColumn = {
  colIndex: number;
  start: number;
  end: number;
};

function FieldRow({ label }: { label: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <div className="h-6 border-b-2 border-slate-400" aria-hidden />
    </div>
  );
}

function QuestionRow({ num }: { num: number }) {
  return (
    <div className="flex items-center gap-1.5 py-[2px] text-[10px] leading-none">
      <span className="w-4 shrink-0 text-right font-bold tabular-nums text-slate-800">
        {num}
      </span>
      <div className="flex gap-1">
        {CHOICES.map((opt) => (
          <div
            key={opt}
            className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-slate-400 bg-white text-[8px] font-semibold text-slate-500 print:border-slate-600"
            aria-hidden
          >
            {opt}
          </div>
        ))}
      </div>
    </div>
  );
}

function renderQuestionRange(start: number, end: number) {
  const rows = [];
  for (let i = start; i <= end; i += 1) {
    rows.push(<QuestionRow key={i} num={i} />);
  }
  return rows;
}

function buildColumns(totalQuestions: number): OptikColumn[] {
  const count = Math.max(1, totalQuestions);
  const columnCount = Math.ceil(count / QUESTIONS_PER_COLUMN);

  return Array.from({ length: columnCount }, (_, colIndex) => ({
    colIndex,
    start: colIndex * QUESTIONS_PER_COLUMN + 1,
    end: Math.min((colIndex + 1) * QUESTIONS_PER_COLUMN, count),
  }));
}

/** Önce sağ sütun, sonra sol — fiziksel optik sırası */
function columnsRightToLeft(columns: OptikColumn[]): OptikColumn[] {
  return [...columns].reverse();
}

function OptikColumnBlock({ start, end, label }: { start: number; end: number; label: string }) {
  return (
    <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded border border-slate-300 bg-white">
      <div className="shrink-0 border-b border-slate-200 bg-slate-50 px-2 py-1 text-center">
        <span className="text-[9px] font-bold uppercase tracking-wide text-slate-600">
          {label}
        </span>
        <span className="ml-1 text-[9px] tabular-nums text-slate-500">
          ({start}–{end})
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden px-1.5 py-1">{renderQuestionRange(start, end)}</div>
    </div>
  );
}

export function OptikForm({ totalQuestions, dersLabel, kurum, className }: OptikFormProps) {
  const count = Math.max(1, totalQuestions);

  const { columnCount, displayColumns } = useMemo(() => {
    const logical = buildColumns(count);
    return {
      columnCount: logical.length,
      displayColumns: columnsRightToLeft(logical),
    };
  }, [count]);

  return (
    <div
      className={cn(
        "tm-optik-form relative flex h-full w-full flex-col text-slate-900 print:h-full print:w-full",
        className
      )}
    >
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-30 print:opacity-40"
        aria-hidden
        viewBox="0 0 210 297"
        preserveAspectRatio="none"
      >
        <rect x="4" y="4" width="6" height="6" fill="none" stroke="currentColor" strokeWidth="0.4" />
        <rect x="200" y="4" width="6" height="6" fill="none" stroke="currentColor" strokeWidth="0.4" />
        <rect x="4" y="287" width="6" height="6" fill="none" stroke="currentColor" strokeWidth="0.4" />
        <rect
          x="200"
          y="287"
          width="6"
          height="6"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.4"
        />
      </svg>

      {/* Sayfa başı — tek seferlik öğrenci bilgileri */}
      <header className="relative z-[1] shrink-0 border-2 border-slate-800 px-3 py-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
              {kurum || "KURUM ADI"}
            </p>
            <h2 className="text-base font-bold tracking-tight text-slate-900">YKS OPTİK FORM</h2>
            {dersLabel ? (
              <p className="text-[10px] font-semibold text-slate-700">{dersLabel}</p>
            ) : null}
          </div>
          <div className="shrink-0 rounded border border-slate-300 px-2 py-1 text-center">
            <p className="text-[8px] font-semibold uppercase text-slate-500">Ders kodu</p>
            <p className="text-xs font-bold text-slate-800">{dersLabel?.slice(0, 8) || "—"}</p>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-4 gap-3">
          <FieldRow label="Ad" />
          <FieldRow label="Soyad" />
          <FieldRow label="Okul No" />
          <FieldRow label="Sınav Tarihi" />
        </div>

        <div className="mt-2 grid grid-cols-2 gap-3 border-t border-slate-200 pt-2">
          <div>
            <p className="text-[9px] font-semibold uppercase text-slate-500">Sınav sonucu</p>
            <div className="mt-0.5 h-6 border-b-2 border-dashed border-slate-300" aria-hidden />
          </div>
          <div>
            <p className="text-[9px] font-semibold uppercase text-slate-500">Öğrenci no</p>
            <div className="mt-0.5 flex gap-0.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-6 w-4 shrink-0 rounded border border-slate-400 bg-white"
                  aria-hidden
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Dinamik çoklu sütun — sağdan sola */}
      <div className="relative z-[1] mt-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded border-2 border-slate-800">
        <div className="shrink-0 border-b border-slate-200 bg-slate-50 px-2 py-1 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-700">
            Cevap işaretleme — {count} soru · {columnCount} sütun
          </p>
          <p className="text-[9px] text-slate-500">
            Sütun sırası: sağdan sola. Her soruda tek şık boyayın.
          </p>
        </div>

        <div
          className="grid min-h-0 flex-1 gap-3 overflow-hidden p-2"
          style={{
            gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
            direction: "rtl",
          }}
        >
          {displayColumns.map((col) => (
            <div key={col.colIndex} className="min-h-0 min-w-0" style={{ direction: "ltr" }}>
              <OptikColumnBlock
                start={col.start}
                end={col.end}
                label={columnCount > 1 ? `Sütun ${col.colIndex + 1}` : "Sorular"}
              />
            </div>
          ))}
        </div>
      </div>

      <footer className="relative z-[1] mt-1.5 shrink-0 text-center text-[8px] text-slate-500">
        Optik form — işaretlemeleri silmeyin; taşımayın.
      </footer>
    </div>
  );
}
