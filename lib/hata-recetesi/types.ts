import type { AnswerLetter } from "@/lib/test-maker/types";

export type HataKaynagi = "deneme" | "soru_bankasi";
export type HataTipi = "yanlis" | "bos";

export interface WrongQuestionRecord {
  id: string;
  uuid: string;
  dataUrl: string;
  imageFileId?: string;
  imageBucketId?: string;
  ders: string;
  konu: string;
  kavram?: string;
  answer: AnswerLetter | null;
  ogrenciAdi: string;
  ogrenci?: string;
  hataKaynagi?: HataKaynagi;
  hataTipi?: HataTipi;
  page?: number | null;
  qNumber?: string;
  soruNo?: string;
  auto?: boolean;
  savedAt: string;
  examId?: string;
  examName?: string;
}

export interface RecipeArchiveRecord {
  id: string;
  name: string;
  studentCanonical: string;
  studentId?: string;
  studentCode?: string;
  ders: string;
  konu: string;
  kurum?: string;
  coverTitle?: string;
  questionCount: number;
  answerKey: string;
  template?: string;
  layout?: { qPerPage?: string; sablon?: string };
  questions: { id: string; imageDataUrl: string; answer: string | null }[];
  thumbs?: string[];
  pdf_file_id?: string;
  createdAt: number;
  updatedAt: number;
  status?: "taslak" | "arsiv" | "gonderildi";
}

export interface ReceteTransferPayload {
  v: 1;
  ts: number;
  studentCanonical: string;
  questions: WrongQuestionRecord[];
}

export type MeetingHandoffPayload = {
  receteCanonical?: string;
  receteLabel?: string;
  name?: string;
};
