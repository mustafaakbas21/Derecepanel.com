export type AnswerLetter = "A" | "B" | "C" | "D" | "E";
export type QPerPage = 4 | 6;

export type TemplateId =
  | "derece"
  | "uc-boyutlu"
  | "sarmal"
  | "yeni-nesil"
  | "limitless"
  | "hiz-renk"
  | "orijinal-mat"
  | "karekök"
  | "aydinlik"
  | "paraf";

export interface TMQuestion {
  id: string;
  imageDataUrl: string;
  answer: AnswerLetter | null;
  fromHavuz?: boolean;
  poolUuid?: string;
}

export interface TMConfig {
  dersId: string;
  dersLabel: string;
  konuId: string;
  konuLabel: string;
  kurum: string;
  coverTitle: string;
  ogrenciId: string;
}

export interface QuestionPoolItem {
  uuid: string;
  dataUrl: string;
  ders: string;
  konu: string;
  kavram: string;
  answer: AnswerLetter | null;
  page?: number | null;
  qNumber?: string;
  soruNo?: string;
  auto?: boolean;
  savedAt: string;
  hataKaynagi?: "deneme" | "soru_bankasi";
}

export interface TaramaRecord {
  id: string;
  name: string;
  ders: string;
  konu: string;
  kurum: string;
  coverTitle: string;
  createdAt: number;
  updatedAt: number;
  layout: { qPerPage?: string; sablon?: string };
  questions: { id: string; imageDataUrl: string; answer: string | null }[];
  thumbs?: string[];
  pdf_file_id?: string;
  matrixSnapshot?: string | null;
  cevapAnahtari?: string;
}

export interface TaramaExportMeta {
  id: string;
  name: string;
  soruSayisi: number;
  savedAt: string;
}

export interface FascicleAssignment {
  id: string;
  title: string;
  questionCount: number;
  answerKey: string;
  template: string;
  studentCode?: string;
  studentId?: string;
  source: "test_maker_send";
  assignedAt: string;
  status: "bekliyor" | "tamamlandi";
  pdf_file_id?: string;
}

export interface MatrixQuestionRow {
  qNo: number;
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
}

export interface MatrixBundle {
  examKey: string;
  name: string;
  date: string;
  questions: MatrixQuestionRow[];
  savedAt: string;
}
