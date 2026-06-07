import { describe, expect, it } from "vitest";

import {
  bursLabelFromEkBilgi,
  deriveBolumDili,
  formatUniversiteDisplayName,
  hasDepremKontenjan,
} from "@/lib/yks-sim/atlas-program-display";
import type { YokAtlasProgram } from "@/lib/universities/types";

const row = (parts: Partial<YokAtlasProgram>): YokAtlasProgram => ({
  Program_Kodu: "1",
  Puan_Tipi: "SAY",
  Universite: "HALİÇ",
  Sehir: "İSTANBUL",
  Bolum: "Tıp",
  Fakulte_YO: "",
  Ek_Bilgi_1: "",
  Ek_Bilgi_2: "",
  Sure_Yil: "4",
  Basari_2025: "",
  Basari_2024: "",
  Basari_2023: "",
  Taban_2025: "",
  Taban_2024: "",
  Taban_2023: "",
  Basari_Sirasi_Guncel: "",
  Taban_Puani_Guncel: "",
  Kontenjan_2025_Genel: "",
  Kontenjan_2024_Genel: "",
  Kontenjan_2023_Genel: "",
  Kontenjan_Diger: "",
  Ozel_Kosul_Kodlari: "",
  Akreditasyon: "",
  Ek_Isaret: "",
  ...parts,
});

describe("formatUniversiteDisplayName", () => {
  it("appends Üniversitesi for short names", () => {
    expect(formatUniversiteDisplayName("HALİÇ")).toBe("HALİÇ Üniversitesi");
    expect(formatUniversiteDisplayName("KOÇ")).toBe("KOÇ Üniversitesi");
    expect(formatUniversiteDisplayName("İSTANBUL MEDİPOL")).toBe(
      "İSTANBUL MEDİPOL Üniversitesi"
    );
  });

  it("keeps names that already include Üniversitesi", () => {
    expect(formatUniversiteDisplayName("İSTANBUL ÜNİVERSİTESİ")).toBe(
      "İSTANBUL ÜNİVERSİTESİ"
    );
  });
});

describe("deriveBolumDili", () => {
  it("reads İngilizce from Ek_Bilgi_1", () => {
    expect(deriveBolumDili(row({ Ek_Bilgi_1: "İngilizce", Ek_Bilgi_2: "Burslu" }))).toBe(
      "ingilizce"
    );
  });

  it("defaults to turkce", () => {
    expect(deriveBolumDili(row({ Ek_Bilgi_1: "Burslu" }))).toBe("turkce");
  });
});

describe("hasDepremKontenjan", () => {
  it("detects code 144", () => {
    expect(hasDepremKontenjan(row({ Ozel_Kosul_Kodlari: "22, 144, 64" }))).toBe(true);
    expect(hasDepremKontenjan(row({ Ozel_Kosul_Kodlari: "22, 64" }))).toBe(false);
  });
});

describe("bursLabelFromEkBilgi", () => {
  it("reads burs labels from Ek_Bilgi fields", () => {
    expect(bursLabelFromEkBilgi(row({ Ek_Bilgi_1: "Burslu" }))).toBe("Burslu (Tam)");
    expect(bursLabelFromEkBilgi(row({ Ek_Bilgi_1: "Ücretli" }))).toBe("Ücretli");
    expect(bursLabelFromEkBilgi(row({ Ek_Bilgi_1: "%50 İndirimli" }))).toBe("%50 İndirimli");
    expect(
      bursLabelFromEkBilgi(row({ Ek_Bilgi_1: "İngilizce", Ek_Bilgi_2: "%25 İndirimli" }))
    ).toBe("%25 İndirimli");
  });
});
