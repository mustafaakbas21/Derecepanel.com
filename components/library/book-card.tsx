"use client";

import { Pencil, Trash2 } from "lucide-react";

import { DifficultyStars } from "@/components/library/book-difficulty";
import { BookThumb } from "@/components/library/book-thumb";
import { Button } from "@/components/ui/button";
import { bookKindLabel, bookSubjectLabel } from "@/lib/library/book-meta";
import type { LibraryBook } from "@/lib/library/types";
import { cn } from "@/lib/utils";

type Props = {
  book: LibraryBook;
  onEdit: () => void;
  onDelete: () => void;
};

export function BookCard({ book, onEdit, onDelete }: Props) {
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white",
        "shadow-sm transition duration-150 hover:border-slate-300 hover:shadow-md"
      )}
    >
      <div className="relative bg-gradient-to-b from-slate-50 to-slate-100/80 p-3 pb-0">
        <div className="mx-auto w-[72%]">
          <BookThumb book={book} size="lg" className="w-full shadow-md" />
        </div>
        <span className="absolute left-3 top-3 rounded-lg bg-slate-900/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
          {bookKindLabel(book.kind)}
        </span>
        <div className="absolute inset-x-0 bottom-0 flex justify-center gap-2 bg-gradient-to-t from-white via-white/95 to-transparent px-3 pb-2 pt-8 opacity-0 transition group-hover:opacity-100">
          <Button type="button" size="sm" variant="secondary" className="h-8 shadow-sm" onClick={onEdit}>
            <Pencil className="mr-1 h-3.5 w-3.5" />
            Düzenle
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-8 text-red-600 shadow-sm hover:bg-red-50"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4 pt-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {book.publisher}
        </p>
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug text-slate-900">
          {book.title}
        </h3>
        <p className="text-xs font-medium text-slate-600">{bookSubjectLabel(book)}</p>
        {book.estQuestions ? (
          <p className="text-[11px] text-slate-500">~{book.estQuestions} soru</p>
        ) : null}
        <div className="mt-auto flex items-center justify-between pt-2">
          <DifficultyStars value={book.difficulty} readOnly size="sm" />
          {book.hasVideo ? (
            <span className="rounded-md bg-teal-50 px-1.5 py-0.5 text-[10px] font-semibold text-teal-700">
              Video
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
