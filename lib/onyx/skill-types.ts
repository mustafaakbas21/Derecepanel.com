/** Onyx Skill-Based Response — istemci + sunucu paylaşımlı şema */

export type OnyxSkillKind =
  | "vision"
  | "strategy"
  | "analytics"
  | "career"
  | "youtube"
  | "mental"
  | "chat";

/** API / istemci isteği — welcome kartı veya serbest metin */
export type OnyxSkillType =
  | "vision_solve"
  | "strategy"
  | "analytics"
  | "career"
  | "youtube_assistant"
  | "mental_coach"
  | "chat";

export type VisionOsymAnalizi = {
  durum: "evet" | "kismen" | "nadir" | "hayir";
  aciklama: string;
  siklikNotu?: string;
};

export type VisionCozumDetay = {
  dersTipi: "sayisal" | "sozel" | "dil";
  sinavBolumu?: "TYT" | "AYT" | "YDT";
  hocaAcilis?: string;
  temelKural?: string;
  miniOrnek?: string;
  kaynakAlintisi?: string;
  verilenler: string[];
  sekilAnalizi?: string;
  osymTuzagi: string;
  nihaiCevap: string;
  dogrulama: string;
};

export type VisionSoruOnAnalizi = {
  sinavBolumu?: "TYT" | "AYT" | "YDT";
  dersAdi: string;
  konuAdi: string;
  kavramAdi: string;
  zorlukSeviyesi: number;
  zorlukNotu?: string;
  yapamamaSebepleri: string[];
  osymAnalizi: VisionOsymAnalizi;
};

export type VisionSkillData = {
  soruOnAnalizi?: VisionSoruOnAnalizi;
  cozumDetay?: VisionCozumDetay;
  cozum: string[];
  hata: string;
  hataTipi?: string;
  eksikKavram?: string;
  link?: string;
  onyxMesaji?: string;
};

export type StrategyTaskItem = {
  id: string;
  baslik: string;
  aciklama?: string;
  gun?: number;
  /** dakika veya soru sayısı — ölçülebilir hedef */
  sure?: string;
  oncelik?: "kritik" | "yuksek" | "orta";
};

export type StrategyHedefProgram = {
  universite: string;
  bolum: string;
  puanTipi?: string;
  tabanPuani?: string;
  basariSirasi?: string;
  atlasKaynak?: boolean;
};

export type StrategyHedefAnalizi = {
  program: StrategyHedefProgram;
  mevcutToplamNet: number;
  hedefToplamNet: number;
  netFarki: number;
  gerçekcilik: "yuksek" | "orta" | "dusuk" | "veri_yok";
  analiz: string;
  tahminiSure?: string;
};

export type StrategyBransSatiri = {
  ders: string;
  mevcutNet?: number;
  hedefNet?: number;
  oncelik: "kritik" | "yuksek" | "orta";
  gerekce: string;
};

export type StrategySkillData = {
  mevcutNet: number;
  hedefNet: number;
  /** Kurumsal deneme — son TYT net (gerçek) */
  sonTyTNet?: number | null;
  /** Kurumsal deneme — son AYT net (gerçek) */
  sonAytNet?: number | null;
  /** Tahmini hedef TYT net (sıra bandından; puan değil) */
  hedefTyTNet?: number;
  puanTipi?: string;
  ozet?: string;
  hedefAnalizi?: StrategyHedefAnalizi;
  bransAnalizi?: StrategyBransSatiri[];
  oncelikliKonular?: string[];
  koçNotu?: string;
  haftalikGorevler: StrategyTaskItem[];
};

/** Kronolojik deneme trend noktası — grafik + analiz */
export type AnalyticsTrendExamPoint = {
  tarih: string;
  sinav: string;
  net: number;
};

export type AnalyticsSkillData = {
  analiz: {
    gercekci_durum_ozeti: string;
    kirmizi_alarm_durumu: string;
  };
  grafik_verisi_icin_trend: AnalyticsTrendExamPoint[];
  aksiyon_recetesi: string[];
};

/** @deprecated Eski şema — normalize edilir */
export type AnalyticsTrendLinePoint = {
  deneme: string;
  tyt_net: number;
  ayt_net: number;
};

/** @deprecated */
export type AnalyticsWeakTopic = {
  konu: string;
  hata_orani: string;
};

/** @deprecated */
export type AnalyticsSubjectBalance = {
  ders: string;
  basari_yuzdesi: number;
};

/** @deprecated */
export type AnalyticsTimePerSubject = {
  ders: string;
  dakika: number;
};

export type CareerAlternativeItem = {
  bolum: string;
  nedenUygun: string;
  tabanPuani?: string;
  isBulma?: "yüksek" | "orta" | "değişken";
  sektorTrendi?: "yükselen" | "stabil" | "dönüşümde";
};

export type CareerSkillData = {
  vizyon: string;
  mevcutDurum: string;
  alternatifler: CareerAlternativeItem[];
  parlakBolumler?: CareerAlternativeItem[];
  avantajlar?: string[];
  onyxTavsiyesi?: string;
};

export type ChatSkillData = {
  text: string;
};

export type YoutubeKritikKavram = {
  isim: string;
  aciklama: string;
  osymTuzagi: string;
};

export type YoutubeAnlamaSorusu = {
  soru: string;
  cevap: string;
};

/** @deprecated Eski yanıtlar — adapter normalize eder */
export type YoutubeNoteCard = {
  baslik: string;
  icerik: string;
};

/** @deprecated */
export type YoutubeMiniTestSoru = {
  soru: string;
  secenekler?: string[];
  dogruCevap?: string;
};

export type YoutubeSkillData = {
  ozet: string;
  kritikKavramlar: YoutubeKritikKavram[];
  anlamaKontrolu: YoutubeAnlamaSorusu[];
  videoBaslik?: string;
  videoUrl?: string;
};

export type MentalSkillData = {
  /** Samimi dost açılışı */
  dostAcilisi: string;
  /** Duygu + beden + YKS bağlamı */
  duyguHaritasi: string;
  tespitEdilenDuygu: string;
  bdtCalismasi: {
    carpitma: string;
    dusunceKaydi: string;
    alternatifDusunce: string;
  };
  terapotikTelkin: string;
  nefesProtokolu: {
    baslik: string;
    adimlar: string[];
  };
  acilAksiyonRecetesi: string[];
  kanitlar: string[];
  dostKapanisi: string;
};

export type OnyxSkillResponse =
  | { type: "vision"; data: VisionSkillData }
  | { type: "strategy"; data: StrategySkillData }
  | { type: "analytics"; data: AnalyticsSkillData }
  | { type: "career"; data: CareerSkillData }
  | { type: "youtube"; data: YoutubeSkillData }
  | { type: "mental"; data: MentalSkillData }
  | { type: "chat"; data: ChatSkillData };
