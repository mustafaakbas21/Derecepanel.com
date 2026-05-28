/** `data/yks-mufredat.json` şeması — tek müfredat kaynağı */
export interface MufredatKonu {
  id: string;
  ad: string;
}

export interface MufredatDers {
  id: string;
  dersAdi: string;
  konular: MufredatKonu[];
}

export type MufredatTrack = "TYT" | "AYT";

export interface YksMufredatPack {
  TYT: MufredatDers[];
  AYT: MufredatDers[];
  meta?: {
    kaynak?: string;
    olusturulma?: string;
  };
}

/** UI / filtre için düzleştirilmiş konu */
export interface MufredatTopicRef {
  id: string;
  name: string;
  subjectId: string;
  subjectName: string;
  track: MufredatTrack;
}

export interface MufredatSubjectRef {
  id: string;
  name: string;
  track: MufredatTrack;
}
