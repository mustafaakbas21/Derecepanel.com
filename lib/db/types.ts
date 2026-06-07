/** Onyx soru çözüm kayıtları — Prisma şeması ile uyumlu (MVP: JSON dosya deposu) */

export type OnyxQuestionSolveRecord = {
  id: string;
  studentId: string;
  cozum: string;
  konuBasligi: string;
  zorlukSeviyesi: number;
  hataKodu: string;
  /** Derin hata analizi alanları */
  hataTipi?: string;
  kokNeden?: string;
  eksikKavram?: string;
  tavsiyeEdilenAksiyon?: string;
  onyxMesaji?: string;
  cozumAdimlari?: string[];
  subjectId?: string;
  topicId?: string;
  subjectName?: string;
  topicName?: string;
  curriculumMarked: boolean;
  curriculumSkippedReason?: string;
  createdAt: string;
  model: string;
  source: "vision" | "text";
};

export type SaveQuestionToCurriculumInput = {
  studentId: string;
  structured: {
    cozum: string;
    konu_basligi: string;
    zorluk_seviyesi: number;
    hata_kodu: string;
    deepDiagnosis?: {
      cozumAdimlari: string[];
      hataAnalizi: {
        hataTipi: string;
        kökNeden: string;
        eksikKavram: string;
      };
      aksiyonPlani: {
        tavsiyeEdilenAksiyon: string;
        OnyxMesaji: string;
      };
    };
  };
  model: string;
  source?: "vision" | "text";
  /** data URL veya base64 önizleme — QuestionMemory */
  questionImage?: string | null;
};

export type SaveQuestionToCurriculumResult = {
  solve: OnyxQuestionSolveRecord;
  curriculum: {
    applied: boolean;
    subjectId?: string;
    topicId?: string;
    subjectName?: string;
    topicName?: string;
    skippedBecauseCompleted?: boolean;
  };
};
