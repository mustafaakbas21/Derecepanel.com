export type AnalizScope = "kurumsal" | "global";

export type PriorityRow = {
  subjectName: string;
  topicName: string;
  qNo: number;
  classCorrectRate: number;
};

export type AnalizStudent = {
  id: string;
  name: string;
  meta: string;
  net: number;
  correct: number;
  wrong: number;
  blank: number;
  rank: string;
  percentile: string;
};

export type AnalizExamShell = {
  name: string;
  date: string;
  scope: AnalizScope;
  kpi: {
    avgNet: number;
    avgDelta: number;
    avgMax: number;
    attendance: { done: number; total: number };
    bestSubject: { name: string; rate: number } | null;
    drop: { name: string; delta: number } | null;
  };
  classes: {
    labels: string[];
    correct: number[];
    wrong: number[];
    empty: number[];
  };
  subjectGauges: { name: string; rate: number }[];
  /** matrix = konu matrisi; layout = sınav blokları; summary = D/Y/B özeti */
  subjectGaugeMode?: "matrix" | "layout" | "summary";
  insight: string;
  priorityInsight: string;
  priority: PriorityRow[];
  students: AnalizStudent[];
};

export type AnalizExamOption = {
  id: string;
  name: string;
  date: string;
  scope: AnalizScope;
};

export type AnalizData = {
  exams: Record<string, AnalizExamShell>;
  enrollmentTotal: number;
  examList: AnalizExamOption[];
};
