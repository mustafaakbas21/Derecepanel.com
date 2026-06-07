export const KONU_TAKIP_KEY = "derecepanel.konu-takip.v1";
export const KONU_TAKIP_CHANGED_EVENT = "derece:konu-takip-changed";

/** Genel Bakış → Konu Takibi öğrenci aktarımı (sessionStorage) */
export const KONU_TAKIP_HANDOFF_KEY = "konuTakipAktarilanOgrenci";
/** Genel Bakış → Konu Takibi ders aktarımı (sessionStorage) */
export const KONU_TAKIP_HANDOFF_SUBJECT_KEY = "konuTakipAktarilanDers";

export const TOPIC_STATUS_LABELS = {
  baslanmadi: "Başlanmadı",
  calisiliyor: "Çalışılıyor",
  bitti: "Bitti",
} as const;

/** Soru sayacı hızlı ekleme adımları */
export const SOLVED_QUICK_STEPS = [10, 20, 50] as const;
