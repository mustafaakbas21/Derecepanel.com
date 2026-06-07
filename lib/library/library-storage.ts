import { dispatchExamsChange } from "@/lib/exams/events";
import { readJsonArray, writeJson } from "@/lib/exams/local-storage";

import {
  LIBRARY_ASSIGNMENTS_KEY,
  LIBRARY_BOOKS_KEY,
  LIBRARY_CHANGED_EVENT,
} from "@/lib/library/constants";
import type { BookAssignment, LibraryBook } from "@/lib/library/types";

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function dispatchLibraryChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(LIBRARY_CHANGED_EVENT));
  dispatchExamsChange();
}

export function loadBooks(): LibraryBook[] {
  return readJsonArray<LibraryBook>(LIBRARY_BOOKS_KEY);
}

export function saveBooks(list: LibraryBook[]) {
  writeJson(LIBRARY_BOOKS_KEY, list);
  dispatchLibraryChanged();
}

export function getBookById(id: string): LibraryBook | undefined {
  return loadBooks().find((b) => b.id === id);
}

export function addBook(book: Omit<LibraryBook, "id" | "createdAt">): LibraryBook {
  const [row] = addBooksBatch([book]);
  return row!;
}

export function addBooksBatch(
  books: Omit<LibraryBook, "id" | "createdAt">[]
): LibraryBook[] {
  if (books.length === 0) return [];
  const list = loadBooks();
  const created: LibraryBook[] = books.map((book) => ({
    ...book,
    id: uid("book"),
    createdAt: new Date().toISOString(),
    difficulty: Math.max(1, Math.min(5, book.difficulty || 3)),
    topicIds: book.topicIds || [],
  }));
  list.push(...created);
  saveBooks(list);
  return created;
}

export function updateBook(id: string, patch: Partial<LibraryBook>) {
  saveBooks(
    loadBooks().map((b) => (b.id === id ? { ...b, ...patch, id: b.id } : b))
  );
}

export function deleteBook(id: string) {
  saveBooks(loadBooks().filter((b) => b.id !== id));
  saveAssignments(loadAssignments().filter((a) => a.bookId !== id));
}

export function loadAssignments(): BookAssignment[] {
  return readJsonArray<BookAssignment>(LIBRARY_ASSIGNMENTS_KEY);
}

export function saveAssignments(list: BookAssignment[]) {
  writeJson(LIBRARY_ASSIGNMENTS_KEY, list);
  dispatchLibraryChanged();
}

export function addAssignment(
  row: Omit<BookAssignment, "id" | "createdAt" | "progress"> & { progress?: number }
): BookAssignment {
  const dup = loadAssignments().some(
    (a) => a.studentId === row.studentId && a.bookId === row.bookId
  );
  if (dup) {
    throw new Error("Bu kitap öğrenciye zaten atanmış.");
  }
  const item: BookAssignment = {
    ...row,
    id: uid("asg"),
    progress: Math.max(0, Math.min(100, row.progress ?? 0)),
    createdAt: new Date().toISOString(),
  };
  const list = loadAssignments();
  list.push(item);
  saveAssignments(list);
  return item;
}

export function setAssignmentProgress(id: string, progress: number) {
  const pct = Math.max(0, Math.min(100, progress));
  saveAssignments(
    loadAssignments().map((a) => (a.id === id ? { ...a, progress: pct } : a))
  );
}

export function removeAssignment(id: string) {
  saveAssignments(loadAssignments().filter((a) => a.id !== id));
}

export function assignmentsForStudent(studentId: string): BookAssignment[] {
  return loadAssignments().filter((a) => a.studentId === studentId);
}
