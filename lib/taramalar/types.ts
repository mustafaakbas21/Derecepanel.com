export type {
  TaramaExportMeta,
  TaramaRecord,
} from "@/lib/test-maker/types";

export type FascicleSource =
  | "test_maker_send"
  | "tarama_deposu"
  | "tarama_deposu_send"
  | "fasikul_wizard";

export type FasciclePayload = {
  id?: string;
  title: string;
  questionCount: number;
  answerKey: string;
  template?: string;
  studentCode?: string;
  source?: FascicleSource;
  depoId?: string;
  metaName?: string;
  pdf_file_id?: string;
};

export type TaramaDataMirror = {
  id: string;
  depoId: string;
  name: string;
  soruSayisi: number;
  cevapAnahtari: string;
  savedAt: string;
  matrixSnapshot: string | null;
};

export type TaramaExamShell = {
  name: string;
  date: string;
  scope: string;
  soruSayisi: number;
  kpi: {
    avgNet: number;
    avgDelta: number;
    avgMax: number;
    attendance: { done: number; total: number };
    bestSubject: string | null;
    drop: string | null;
  };
  classes: { labels: string[]; correct: number[]; wrong: number[]; empty: number[] };
  subjectGauges: { name: string; rate: number }[];
  insight: string;
  priorityInsight: string;
  priority: unknown[];
  students: TaramaAnalizStudent[];
  cevapAnahtari: string;
};

export type TaramaAnalizStudent = {
  id: string;
  name: string;
  meta: string;
  net: number;
  correct: number;
  wrong: number;
  blank: number;
  rank: string;
  percentile: string;
  topics?: { labels: string[]; values: number[] };
  radar?: { labels: string[]; student: number[]; classAvg: number[] };
  errors?: unknown[];
};

export type TaramaExamResult = {
  examId: string;
  studentId: string;
  name?: string;
  studentName?: string;
  correct: number;
  wrong: number;
  blank: number;
  net: number;
  rank?: string;
  percentile?: string;
  sube?: string;
  topics?: { labels: string[]; values: number[] };
  radar?: { labels: string[]; student: number[]; classAvg: number[] };
  errors?: unknown[];
};

export type FascicleDepotRow = {
  fascicleId: string;
  title: string;
  questionCount: number;
  answerKey: string;
  template?: string;
  studentId: string;
  studentName: string;
  studentCode?: string;
  assignedAt: string;
  status: "bekliyor" | "tamamlandi";
  source: FascicleSource;
  pdf_file_id?: string;
  depoId?: string;
  accuracyPct?: number;
  lastResultTitle?: string;
};

export type FascicleResultRecord = {
  fascicleId?: string;
  title?: string;
  accuracyPct?: number;
  completedAt?: string;
};
