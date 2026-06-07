/** Kariyer modülü — istemci ve sunucu arasında paylaşılan tipler */

export type CareerAlternative = {
  bolum: string;
  nedenUygun: string;
  tabanPuani?: string;
  /** Niteliksel iş piyasası sinyali */
  isBulma?: "yüksek" | "orta" | "değişken";
  sektorTrendi?: "yükselen" | "stabil" | "dönüşümde";
};

export type OnyxCareerCounseling = {
  meslekAnalizi: {
    gelecekVizyonu: string;
    avantajVeDezavantajlar: string[];
  };
  netAnaliziVeAlternatifler: {
    mevcutDurum: string;
    hedefeYakinAlternatifler: CareerAlternative[];
    farkliAmaGelecegiParlakBölümler: CareerAlternative[];
  };
  onyxTavsiyesi: string;
};

export type CareerAtlasRow = {
  level: "lisans" | "onlisans";
  programKodu: string;
  universite: string;
  bolum: string;
  puanTipi: string;
  tabanPuani: string;
  basariSirasi: string;
  kontenjan: string;
};

export type OgrenciNetSnapshot = {
  durum: "mevcut" | "bulunamadi";
  sonTyTNet?: number | null;
  sonAytNet?: number | null;
  sonDenemeler: {
    ad: string;
    sinav: string;
    net: number | null;
    tarih: string;
  }[];
  ozetMetin: string | null;
  /** Prompt'a enjekte edilen deneme neti talimatı */
  promptNotu?: string;
};

export type CareerGroundTruth = {
  ogrenciNetleri: OgrenciNetSnapshot;
  hedef: { universite?: string; bolum?: string; aciklama?: string } | null;
  gercekTabanPuanlar: {
    durum: "mevcut" | "bulunamadi";
    aramaTerimleri: string[];
    programlar: CareerAtlasRow[];
  };
  /** Hedeften farklı, çeşitli alanlar — parlak bölümler için */
  parlakProgramlar?: CareerAtlasRow[];
  strictVeriBloku: string;
};
