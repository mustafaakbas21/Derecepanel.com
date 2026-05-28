/** `data/yok-atlas-lisans.json` ve `yok-atlas-onlisans.json` kayıt şeması */
export type UniversityDegreeLevel = "lisans" | "onlisans";

export interface YokAtlasProgram {
  Program_Kodu: string;
  Puan_Tipi: string;
  Universite: string;
  Sehir: string;
  Bolum: string;
  Fakulte_YO: string;
  Ek_Bilgi_1: string;
  Ek_Bilgi_2: string;
  Sure_Yil: string;
  Basari_2025: string;
  Basari_2024: string;
  Basari_2023: string;
  Taban_2025: string;
  Taban_2024: string;
  Taban_2023: string;
  Basari_Sirasi_Guncel: string;
  Taban_Puani_Guncel: string;
  Kontenjan_2025_Genel: string;
  Kontenjan_2024_Genel: string;
  Kontenjan_2023_Genel: string;
  Kontenjan_Diger: string;
  Ozel_Kosul_Kodlari: string;
  Akreditasyon: string;
  Ek_Isaret: string;
}

export interface UniversityListItem {
  name: string;
  sehir: string;
  programCount: number;
}
