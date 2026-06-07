/** Konu Takip Merkezi — öğrenci bazlı konu ilerleme modeli (localStorage). */

export type TopicStatus = "baslanmadi" | "calisiliyor" | "bitti";

export interface TopicProgress {
  status: TopicStatus;
  /** Konu için toplam çözülen soru sayısı */
  solved: number;
  /** Hedeflenen soru sayısı (opsiyonel) */
  target?: number;
  /** Kütüphaneden seçilen kitap id'leri */
  bookIds: string[];
  /** Koçun konuya özel notu (opsiyonel) */
  note?: string;
  updatedAt: string;
}

/** Anahtar: `${subjectId}::${topicId}` */
export type StudentTracking = Record<string, TopicProgress>;

/** Anahtar: studentId */
export type KonuTakipStore = Record<string, StudentTracking>;
