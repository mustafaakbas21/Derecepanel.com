import { BOOK_KIND_LABELS } from "@/lib/library/constants";
import type { BookKind, LibraryBook } from "@/lib/library/types";
import { getSubjectById } from "@/lib/mufredat";

export function bookKindLabel(kind: BookKind | string): string {
  return BOOK_KIND_LABELS[kind] ?? kind;
}

export function bookSubjectLabel(book: LibraryBook): string {
  if (!book.subjectId) return "—";
  return getSubjectById(book.subjectId)?.name ?? book.subjectId;
}

export function bookSearchHaystack(book: LibraryBook): string {
  return [
    book.title,
    book.publisher,
    bookKindLabel(book.kind),
    bookSubjectLabel(book),
    book.publishYear ?? "",
  ]
    .join(" ")
    .toLowerCase();
}
