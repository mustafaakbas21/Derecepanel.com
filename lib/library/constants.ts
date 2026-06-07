export const LIBRARY_BOOKS_KEY = "derecepanel.library.books.v1";
export const LIBRARY_ASSIGNMENTS_KEY = "derecepanel.library.assignments.v1";
export const LIBRARY_CHANGED_EVENT = "derece:library-changed";

export const BOOK_KIND_LABELS: Record<string, string> = {
  "soru-bankasi": "Soru Bankası",
  "konu-anlatim": "Konu Anlatımı",
  deneme: "Deneme",
  fasikul: "Fasikül",
};

export const PUBLISH_YEAR_OPTIONS = [
  "",
  "2025-2026 MEB Uyumlu",
  "2024-2025 MEB Uyumlu",
  "2023-2024 MEB Uyumlu",
  "2022-2023",
  "Eski müfredat",
];

export const STYLE_OPTIONS = [
  { value: "", label: "— Seçin —" },
  { value: "osym", label: "ÖSYM Tarzı" },
  { value: "yeni-nesil", label: "Yeni Nesil" },
  { value: "klasik", label: "Klasik" },
  { value: "karma", label: "Karma" },
];
