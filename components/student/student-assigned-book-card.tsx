"use client";

import Link from "next/link";
import { Calendar, MessageSquare, UserRound } from "lucide-react";

import { DifficultyStars } from "@/components/library/book-difficulty";
import { BookThumb } from "@/components/library/book-thumb";
import {
  LIBRARY_PANEL_CLASS,
  LibraryProgressBar,
} from "@/components/library/library-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { bookKindLabel, bookSubjectLabel } from "@/lib/library/book-meta";
import { formatDueLabel, type StudentAssignmentView } from "@/lib/library/student-scope";
import { STUDENT_KITAP_ROUTES } from "@/lib/student/sidebar-nav-config";
import { cn } from "@/lib/utils";

type Props = {
  item: StudentAssignmentView;
  coachName?: string;
  className?: string;
};

export function StudentAssignedBookCard({ item, coachName, className }: Props) {
  const book = item.book;
  if (!book) {
    return (
      <article
        className={cn(
          LIBRARY_PANEL_CLASS,
          "border-dashed p-5 text-sm text-slate-500",
          className
        )}
      >
        Kaynak kütüphaneden kaldırılmış olabilir.
      </article>
    );
  }

  const due = formatDueLabel(item.dueDate);
  const done = item.progress >= 100;

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition duration-150 hover:border-slate-300 hover:shadow-md",
        done && "opacity-90",
        className
      )}
      style={{ boxShadow: "var(--card-shadow-sm)" }}
    >
      <div className="relative bg-gradient-to-b from-slate-50 to-slate-100/80 p-3 pb-0">
        <div className="mx-auto w-[68%]">
          <BookThumb book={book} size="lg" className="w-full shadow-md" />
        </div>
        <span className="absolute left-3 top-3 rounded-lg bg-slate-900/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
          {bookKindLabel(book.kind)}
        </span>
        {done ? (
          <span className="absolute right-3 top-3 rounded-lg bg-emerald-600/95 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            Tamamlandı
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 pt-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {book.publisher}
          </p>
          <h3 className="mt-0.5 line-clamp-2 text-sm font-bold leading-snug text-slate-900">
            {book.title}
          </h3>
          <p className="mt-1 text-xs font-medium text-slate-600">{bookSubjectLabel(book)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DifficultyStars value={book.difficulty} readOnly size="sm" />
          {book.estQuestions ? (
            <span className="text-[11px] text-slate-500">~{book.estQuestions} soru</span>
          ) : null}
        </div>

        <LibraryProgressBar value={item.progress} />

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {item.dueDate ? (
            <Badge
              variant={due.tone === "danger" ? "high" : due.tone === "warn" ? "medium" : "default"}
              className="gap-1 font-normal"
            >
              <Calendar className="h-3 w-3" />
              {due.label}
            </Badge>
          ) : null}
          {coachName ? (
            <span className="inline-flex items-center gap-1 text-slate-500">
              <UserRound className="h-3.5 w-3.5" />
              {coachName}
            </span>
          ) : null}
        </div>

        {item.note ? (
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
            <p className="flex items-start gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              <MessageSquare className="mt-0.5 h-3 w-3 shrink-0" />
              Koç notu
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-700">{item.note}</p>
          </div>
        ) : null}

        <div className="mt-auto pt-1">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href={STUDENT_KITAP_ROUTES.ilerleme}>İlerlemeyi güncelle</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
