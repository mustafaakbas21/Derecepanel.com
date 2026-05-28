/**
 * Kitap Kütüphanesi — yerel depolama (Appwrite vb. öncesi).
 * window.DereceLibraryStore
 */
(function (global) {
  var BOOKS_KEY = "derecepanel.library.books.v1";
  var ASSIGN_KEY = "derecepanel.library.assignments.v1";

  function safeParse(json, fallback) {
    try {
      var v = JSON.parse(json);
      return Array.isArray(v) ? v : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function readBooks() {
    if (!global.localStorage) return [];
    return safeParse(global.localStorage.getItem(BOOKS_KEY) || "[]", []);
  }

  function writeBooks(arr) {
    if (!global.localStorage) return;
    global.localStorage.setItem(BOOKS_KEY, JSON.stringify(arr));
    try {
      if (typeof global.dispatchEvent === "function") {
        global.dispatchEvent(new CustomEvent("derece:library-changed"));
      }
    } catch (e) {}
  }

  function readAssignments() {
    if (!global.localStorage) return [];
    return safeParse(global.localStorage.getItem(ASSIGN_KEY) || "[]", []);
  }

  function writeAssignments(arr) {
    if (!global.localStorage) return;
    global.localStorage.setItem(ASSIGN_KEY, JSON.stringify(arr));
    try {
      if (typeof global.dispatchEvent === "function") {
        global.dispatchEvent(new CustomEvent("derece:library-changed"));
      }
    } catch (e) {}
  }

  function uid(prefix) {
    return (prefix || "id") + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 9);
  }

  global.DereceLibraryStore = {
    getBooks: readBooks,
    saveBooks: writeBooks,
    addBook: function (book) {
      var list = readBooks();
      book.id = book.id || uid("book");
      book.createdAt = book.createdAt || new Date().toISOString();
      list.push(book);
      writeBooks(list);
      return book;
    },
    updateBook: function (id, patch) {
      var list = readBooks();
      var next = list.map(function (b) {
        return b.id === id ? Object.assign({}, b, patch) : b;
      });
      writeBooks(next);
    },
    deleteBook: function (id) {
      writeBooks(readBooks().filter(function (b) {
        return b.id !== id;
      }));
      writeAssignments(
        readAssignments().filter(function (a) {
          return a.bookId !== id;
        })
      );
    },
    getBookById: function (id) {
      var list = readBooks();
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === id) return list[i];
      }
      return null;
    },
    getAssignments: readAssignments,
    addAssignment: function (row) {
      var list = readAssignments();
      row.id = row.id || uid("asg");
      row.progress = typeof row.progress === "number" ? Math.max(0, Math.min(100, row.progress)) : 0;
      row.createdAt = row.createdAt || new Date().toISOString();
      list.push(row);
      writeAssignments(list);
      return row;
    },
    setAssignmentProgress: function (id, pct) {
      var n = Math.max(0, Math.min(100, Number(pct) || 0));
      writeAssignments(
        readAssignments().map(function (a) {
          return a.id === id ? Object.assign({}, a, { progress: n }) : a;
        })
      );
    },
    removeAssignment: function (id) {
      writeAssignments(
        readAssignments().filter(function (a) {
          return a.id !== id;
        })
      );
    },
  };
})(typeof window !== "undefined" ? window : this);
