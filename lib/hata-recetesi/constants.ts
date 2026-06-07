/** localStorage / IndexedDB anahtarları — ESKİ Derecepanel21 ile uyumlu */
export const HATA_RECETE_LS = {
  wrongPool: "derece_hatali_soru_havuzu",
  transferQuestions: "aktarilanReceteSorulari",
  transferStudent: "receteOgrenciAdi",
  meetingHandoff: "aktarilanOgrenci",
} as const;

export const RECETE_DB = {
  name: "derece_recete_deposu",
  version: 1,
  store: "receteler",
} as const;

export const HATA_RECETESI_ROUTES = {
  root: "/dashboard/hata-recetesi",
  havuz: "/dashboard/hata-recetesi/havuz",
  receteYaz: "/dashboard/hata-recetesi/recete-yaz",
  receteDeposu: "/dashboard/hata-recetesi/recete-deposu",
} as const;
