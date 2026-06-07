"use client";

import { useCallback, useEffect, useState } from "react";
import { Calendar, Check } from "lucide-react";

import { DifficultyStars } from "@/components/library/book-difficulty";
import { BookThumb } from "@/components/library/book-thumb";
import { LibraryProgressBar } from "@/components/library/library-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { bookKindLabel, bookSubjectLabel } from "@/lib/library/book-meta";
import { formatDueLabel, type StudentAssignmentView } from "@/lib/library/student-scope";
import { cn } from "@/lib/utils";

const QUICK_STEPS = [0, 25, 50, 75, 100] as const;

type Props = {
  item: StudentAssignmentView;
  onProgressChange: (assignmentId: string, pct: number) => void;
};

export function StudentAssignmentProgressRow({ item, onProgressChange }: Props) {
  const book = item.book;
  const [local, setLocal] = useState(item.progress);

  useEffect(() => {
    setLocal(item.progress);
  }, [item.progress]);

  const commit = useCallback(
    (pct: number) => {
      const clamped = Math.max(0, Math.min(100, Math.round(pct)));
      setLocal(clamped);
      onProgressChange(item.id, clamped);
    },
    [item.id, onProgressChange]
  );

  if (!book) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500">
        Kaldırılmış kaynak
      </div>
    );
  }

  const due = formatDueLabel(item.dueDate);
  const done = local >= 100;

  return (
    <article
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5",
        done && "border-emerald-200/80 bg-emerald-50/30"
      )}
      style={{ boxShadow: "var(--card-shadow-sm)" }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <BookThumb book={book} size="md" className="shrink-0" />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  {bookKindLabel(book.kind)}
                </span>
                {done ? (
                  <Badge variant="teal" className="gap-1">
                    <Check className="h-3 w-3" />
                    Tamamlandı
                  </Badge>
                ) : null}
              </div>
              <h3 className="mt-1.5 text-base font-bold text-slate-900">{book.title}</h3>
              <p className="text-sm text-slate-600">
                {book.publisher} · {bookSubjectLabel(book)}
              </p>
            </div>
            <DifficultyStars value={book.difficulty} readOnly size="sm" />
          </div>

          {item.dueDate ? (
            <Badge
              variant={due.tone === "danger" ? "high" : due.tone === "warn" ? "medium" : "default"}
              className="gap-1 font-normal"
            >
              <Calendar className="h-3 w-3" />
              {due.label}
            </Badge>
          ) : null}

          {item.note ? (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{item.note}</p>
          ) : null}

          <LibraryProgressBar value={local} />

          <div className="space-y-3">
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={local}
              onChange={(e) => setLocal(Number(e.target.value))}
              onMouseUp={(e) => commit(Number((e.target as HTMLInputElement).value))}
              onTouchEnd={(e) => commit(Number((e.target as HTMLInputElement).value))}
              className="h-2 w-full cursor-pointer accent-slate-900"
              aria-label={`${book.title} ilerleme`}
            />
            <div className="flex flex-wrap gap-2">
              {QUICK_STEPS.map((step) => (
                <Button
                  key={step}
                  type="button"
                  size="sm"
                  variant={local === step ? "primary" : "outline"}
                  className="h-8 min-w-[3rem] tabular-nums"
                  onClick={() => commit(step)}
                >
                  %{step}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
