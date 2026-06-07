export type SinavTipi = "TYT" | "AYT" | "YDT";
export type KurumDenemeDurum = "taslak" | "aktif" | "tamamlandi";
export type OgrenciKapsam = "tum" | "secili";

/** B/C/D kitapçık soru sırası → A (master) soru numarası */
export type KitapcikHaritalari = Partial<Record<"B" | "C" | "D", number[]>>;

export type ExamTur = SinavTipi | "YKS";

/** Global takvim kaydı — wizard tam veya minimal (scrape) */
export interface GlobalExam {
  id: string;
  ad: string;
  name?: string;
  tarih: string;
  saat: string;
  sinav: SinavTipi;
  tur: ExamTur;
  yayinevi?: string;
  soruSayisi?: number;
  pdfName?: string;
  pdfUrl?: string;
  pdfYuklu?: boolean;
  matrixPct?: number;
  durum?: KurumDenemeDurum;
  atanan?: number;
  ogrenciKapsam?: OgrenciKapsam;
  sinifler?: string[];
  cevaplar?: string[];
  zorluk?: string[];
  konu?: string[];
  konuYazi?: string[];
  kitapcikHaritalari?: KitapcikHaritalari;
  kaynakSlug?: string;
  scope?: "global";
  createdAt?: string;
  updatedAt?: string;
}

export interface KurumDeneme {
  id: string;
  ad: string;
  tarih: string;
  saat: string;
  sinav: SinavTipi;
  soruSayisi: number;
  pdfName?: string;
  pdfUrl?: string;
  pdfCloudRef?: { bucketId: string; fileId: string };
  pdfYuklu?: boolean;
  matrixPct?: number;
  durum?: KurumDenemeDurum;
  atanan?: number;
  ogrenciKapsam?: OgrenciKapsam;
  sinifler?: string[];
  cevaplar: string[];
  zorluk: string[];
  konu: string[];
  konuYazi: string[];
  kitapcikHaritalari?: KitapcikHaritalari;
  institutionId?: string;
  coachId?: string;
  createdAt?: string;
  updatedAt?: string;
  scope?: "kurumsal";
}

export interface MergedExam extends KurumDeneme {
  name: string;
  date: string;
  isGlobal: boolean;
}

export interface ExamResultRow {
  examId: string;
  examName?: string;
  studentId: string;
  studentCode?: string;
  name?: string;
  studentName?: string;
  book?: string;
  answers: string;
  correct?: number;
  wrong?: number;
  blank?: number;
  net?: number | null;
  sube?: string;
  source?: string;
  savedAt: string;
  puan?: number | string;
}

export interface ExamResultPackage {
  id: string;
  savedAt: string;
  source: string;
  parser: string;
  template: string;
  examId: string;
  examName: string;
  count: number;
  updateExisting: boolean;
  items: unknown[];
}

export type ParseIssue = "no-book" | "duplicate" | "no-code" | "unmatched";

export interface ParseRow {
  id: string;
  no: string;
  name: string;
  book: string;
  answers: string;
  correct: number;
  wrong: number;
  blank: number;
  net: number | null;
  sube: string;
  matched: boolean;
  matchedId: string | null;
  studentId: string | null;
  status: "matched" | "unmatched";
  selected: boolean;
  issues: ParseIssue[];
}

export interface CatalogStudent {
  id: string;
  code: string;
  name: string;
  coachId?: string;
  sube?: string;
  alan?: string;
}

export interface FmtFieldDef {
  kind: "no" | "name" | "book" | "answers";
  start: number;
  length: number | null;
}

export interface ParserTemplate {
  label: string;
  fields: FmtFieldDef[];
  tabbed: boolean;
  minLine: number;
  expectedAnswers?: number;
  __fmtId?: string;
}

export interface ExamLayoutSection {
  title: string;
  startQ: number;
  endQ: number;
}

export interface ExamLayoutCell {
  subjectId: string;
  sectionTitle: string;
}

export interface ExamLayout {
  n: number;
  sections: ExamLayoutSection[];
  byIndex: ExamLayoutCell[];
}

export interface RankMeta {
  genel: Record<string, number>;
  sinif: Record<string, number>;
  total: number;
}

export interface DynCounts {
  d: number;
  y: number;
  n: number;
}
