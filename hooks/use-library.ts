"use client";

import { useCallback, useEffect, useState } from "react";

import { onExamsChange } from "@/lib/exams/events";
import { LIBRARY_CHANGED_EVENT } from "@/lib/library/constants";
import {
  addAssignment,
  addBook,
  deleteBook,
  loadAssignments,
  loadBooks,
  removeAssignment,
  setAssignmentProgress,
  updateBook,
} from "@/lib/library/library-storage";
import type { BookAssignment, LibraryBook } from "@/lib/library/types";

export function useLibrary() {
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [assignments, setAssignments] = useState<BookAssignment[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(() => {
    setBooks(loadBooks());
    setAssignments(loadAssignments());
    setHydrated(true);
  }, []);

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener(LIBRARY_CHANGED_EVENT, onChange);
    const offExams = onExamsChange(onChange);
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === "derecepanel.library.books.v1" ||
        e.key === "derecepanel.library.assignments.v1" ||
        e.key === "derecepanel_students_full_v1" ||
        e.key === "students"
      ) {
        refresh();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(LIBRARY_CHANGED_EVENT, onChange);
      offExams();
      window.removeEventListener("storage", onStorage);
    };
  }, [refresh]);

  return {
    books,
    assignments,
    hydrated,
    refresh,
    addBook: (b: Parameters<typeof addBook>[0]) => {
      const row = addBook(b);
      refresh();
      return row;
    },
    updateBook: (id: string, patch: Partial<LibraryBook>) => {
      updateBook(id, patch);
      refresh();
    },
    deleteBook: (id: string) => {
      deleteBook(id);
      refresh();
    },
    addAssignment: (payload: Parameters<typeof addAssignment>[0]) => {
      const created = addAssignment(payload);
      refresh();
      return created;
    },
    setAssignmentProgress: (id: string, pct: number) => {
      setAssignmentProgress(id, pct);
      refresh();
    },
    removeAssignment: (id: string) => {
      removeAssignment(id);
      refresh();
    },
  };
}
