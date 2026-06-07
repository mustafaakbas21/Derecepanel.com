export type GorevTipi =

  | "konu_calisma"

  | "soru_cozme"

  | "deneme_cozme"

  | "etut_mola"

  | "tekrar"

  | "video";



export type TaskAccent = "math" | "turkish" | "science" | "default";



export type WeeklyTask = {

  id: string;

  dayIndex: number;

  title: string;

  meta: string;

  accent: TaskAccent;

  taskKind: GorevTipi;

  subjectId?: string;

  subjectName?: string;

  topicId?: string;

  topicName?: string;

  conceptNames?: string[];

  targetQuestions?: string;

  durationMin?: string;

  resource?: string;

  videoUrl?: string;

  coachNote?: string;

  dateISO?: string;

  /** AI öneri kartından türetildiyse */

  suggestionKey?: string;

};



export type MrTier = "kritik" | "dikkat" | "normal";



export type TopicTrend = "persistent" | "falling" | "new_weak" | "recovering" | "stable";



export type ExamSnapshot = {

  examId: string;

  name: string;

  dateISO: string;

};



export type ExamTopicCell = {

  examIndex: number;

  examName: string;

  score: number | null;

  wrong: number;

  total: number;

};



export type HeatmapSubject = {

  id: string;

  label: string;

  score: number;

  wrongCount: number;

  totalCount: number;

  subjectId?: string;

  topicId?: string;

  topicName?: string;

  trend?: TopicTrend;

  tier?: MrTier;

  examsAppeared?: number;

  /** Yeni → eski; examSnapshots ile aynı sıra */

  perExamScores?: (number | null)[];

};



export type TopicDiagnostic = {

  label: string;

  subjectId?: string;

  topicId?: string;

  subjectName?: string;

  topicName?: string;

  aggregateScore: number;

  wrongCount: number;

  totalCount: number;

  examsAppeared: number;

  trend: TopicTrend;

  tier: MrTier;

  priority: number;

  perExam: ExamTopicCell[];

};



export type AiSuggestion = {

  id: string;

  title: string;

  subtitle: string;

  priority: "high" | "routine";

  topicKey: string;

  taskKind: GorevTipi;

  targetQuestions?: string;

  subjectId?: string;

  topicId?: string;

  subjectName?: string;

  topicName?: string;

  score?: number;

  wrongCount?: number;

  totalCount?: number;

  suggestedDurationMin?: string;

  coachNote?: string;

  trend?: TopicTrend;

  tier?: MrTier;

  examsAppeared?: number;

  /** Örn. "D1 %0 · D2 %25 · D3 %40" */

  examBreakdown?: string;

};



export type MrSummary = {

  persistentCount: number;

  fallingCount: number;

  kritikCount: number;

  topicsWithWrongs: number;

  totalWrongQuestions: number;

  subjectsWithSuggestions: number;

};



export type SubjectMrSummary = {

  subjectId: string;

  subjectName: string;

  wrongQuestions: number;

  topicCount: number;

  worstScore: number | null;

  suggestionCount: number;

};



export type ExamInsightsResult = {

  heatmap: HeatmapSubject[];

  /** Tüm dersler — hatalı konu bazlı dengeli havuz */

  suggestions: AiSuggestion[];

  topicDiagnostics: TopicDiagnostic[];

  subjectSummaries: SubjectMrSummary[];

  criticalTopic: string | null;

  examCount: number;

  examSnapshots: ExamSnapshot[];

  latestExamName: string | null;

  latestExamDate: string | null;

  emptyReason: string | null;

  summary: MrSummary;

};



export type WeeklyPlannerDraft = {

  studentId: string;

  weekMondayISO: string;

  tasks: WeeklyTask[];

  updatedAt: string;

};

