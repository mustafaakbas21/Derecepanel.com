import { beforeEach, describe, expect, it, vi } from "vitest";

import { panelGetItem, panelRemoveItem, panelSetItem } from "@/lib/panel-store";
import {
  LIBRARY_ASSIGNMENTS_KEY,
  LIBRARY_BOOKS_KEY,
} from "@/lib/library/constants";
import {
  addAssignment,
  addBook,
  assignmentsForStudent,
  loadAssignments,
  loadBooks,
  removeAssignment,
} from "@/lib/library/library-storage";

function createStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (k) => map.delete(k),
    setItem: (k, v) => map.set(k, v),
  };
}

describe("library-storage", () => {
  beforeEach(() => {
    const storage = createStorage();
    vi.stubGlobal("localStorage", storage);
    vi.stubGlobal("window", { dispatchEvent: vi.fn() });
  });

  it("adds book and assignment", () => {
    const book = addBook({
      title: "Test Kitap",
      publisher: "Yayın",
      kind: "soru-bankasi",
      subjectId: "tyt-mat",
      topicIds: [],
      difficulty: 3,
    });
    expect(loadBooks()).toHaveLength(1);
    expect(book.id).toBeTruthy();

    addAssignment({ studentId: "st-1", bookId: book.id });
    expect(loadAssignments()).toHaveLength(1);
    expect(assignmentsForStudent("st-1")).toHaveLength(1);
  });

  it("rejects duplicate assignment", () => {
    const book = addBook({
      title: "A",
      publisher: "B",
      kind: "deneme",
      subjectId: "tyt-mat",
      topicIds: [],
      difficulty: 2,
    });
    addAssignment({ studentId: "st-1", bookId: book.id });
    expect(() => addAssignment({ studentId: "st-1", bookId: book.id })).toThrow(
      /zaten/
    );
  });

  it("removes assignment", () => {
    const book = addBook({
      title: "A",
      publisher: "B",
      kind: "deneme",
      subjectId: "tyt-mat",
      topicIds: [],
      difficulty: 2,
    });
    const asg = addAssignment({ studentId: "st-1", bookId: book.id });
    removeAssignment(asg.id);
    expect(assignmentsForStudent("st-1")).toHaveLength(0);
  });

  it("uses legacy storage keys", () => {
    addBook({
      title: "X",
      publisher: "Y",
      kind: "fasikul",
      subjectId: "tyt-mat",
      topicIds: [],
      difficulty: 1,
    });
    expect(panelGetItem(LIBRARY_BOOKS_KEY)).toContain("X");
    addAssignment({ studentId: "s", bookId: loadBooks()[0]!.id });
    expect(panelGetItem(LIBRARY_ASSIGNMENTS_KEY)).toBeTruthy();
  });
});
