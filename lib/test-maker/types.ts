export type AnswerLetter = "A" | "B" | "C" | "D" | "E";
/** Kırpma / cevap anahtarı — boş bırakılmış soru */
export type QuestionAnswer = AnswerLetter | "blank" | null;
export type CropAnswerChoice = AnswerLetter | "blank";
export type QPerPage = 2 | 4 | 6;

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
  answer: QuestionAnswer;
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
  imageFileId?: string;
  imageBucketId?: string;
  ders: string;
  konu: string;
  kavram: string;
  answer: QuestionAnswer;
  page?: number | null;
  qNumber?: string;
  soruNo?: string;
  auto?: boolean;
  savedAt: string;
  hataKaynagi?: "deneme" | "soru_bankasi";
  /** Yalnızca UI — kırpma önizlemesi; baskı/PDF çıktısına girmez */
  sourcePdf?: string;
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

export type FascicleSource =
  | "test_maker_send"
  | "tarama_deposu"
  | "tarama_deposu_send"
  | "fasikul_wizard";

export interface FascicleAssignment {
  id: string;
  title: string;
  questionCount: number;
  answerKey: string;
  template: string;
  studentCode?: string;
  studentId?: string;
  source: FascicleSource;
  assignedAt: string;
  status: "bekliyor" | "tamamlandi";
  pdf_file_id?: string;
  depoId?: string;
  metaName?: string;
}

export interface MatrixQuestionRow {
  qNo: number;
  subjectId: string;
  subjectName: string;
  topicId: string | null;
  topicName: string | null;
}

export interface MatrixBundle {
  examKey: string;
  name: string;
  date: string;
  questions: MatrixQuestionRow[];
  savedAt: string;
}
