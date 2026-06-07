/** YKS koçluk — konu hakimiyeti zaman serisi analizi */

export type ExamType = "TYT" | "AYT" | "YDT";

export type TrendStatus =
  | "CRITICAL_DROP"
  | "CHRONIC_WEAK"
  | "STABLE_HIGH"
  | "RISING"
  | "INSUFFICIENT_DATA";

export type TopicStat = {
  konuAdi: string;
  dersAdi: string;
  dogru: number;
  yanlis: number;
  bos: number;
  net: number;
  basariYuzdesi: number;
  /** subject|topic birleşik anahtar */
  topicKey: string;
};

/** Seçili denemedeki konu özeti */
export type TopicCurrentStats = {
  dogru: number;
  yanlis: number;
  bos: number;
  yuzde: number;
};

/** Aynı tip geçmiş denemelerde kümülatif konu özeti */
export type TopicHistoricalStats = {
  toplamSoru: number;
  toplamDogru: number;
  toplamYanlis: number;
  toplamBos: number;
};

export type TopicTrendAnalysis = TopicStat & {
  trendStatus: TrendStatus;
  /** Geçmiş denemelerde ağırlıklı başarı % */
  gecmisOrtalama: number;
  /** Seçili (şu anki) deneme başarı % */
  simdikiBasari: number;
  /** Geçmişte bu konuda toplam soru sayısı */
  gecmisSoruSayisi: number;
  /** Tooltip kanıt metni */
  kanitMetni: string;
  currentStats: TopicCurrentStats;
  historicalStats: TopicHistoricalStats;
};

export type ExamTimelineEntry = {
  examId: string;
  examName: string;
  examDate: string;
  examType: ExamType;
};
