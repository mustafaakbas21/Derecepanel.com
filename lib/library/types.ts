export type BookKind = "soru-bankasi" | "konu-anlatim" | "deneme" | "fasikul";

export type LibraryBook = {
  id: string;
  title: string;
  publisher: string;
  kind: BookKind;
  subjectId: string;
  topicIds: string[];
  publishYear?: string;
  estQuestions?: number;
  difficulty: number;
  hasVideo?: boolean;
  style?: string;
  coverDataUrl?: string;
  pdfDataUrl?: string;
  pdfName?: string;
  createdAt: string;
};

export type BookAssignment = {
  id: string;
  studentId: string;
  bookId: string;
  dueDate?: string;
  note?: string;
  progress: number;
  createdAt: string;
};
