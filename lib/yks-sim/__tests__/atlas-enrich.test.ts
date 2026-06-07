import { describe, expect, it } from "vitest";

import {
  enrichAtlasBursTuru,
  matchesKurum,
  matchesOgrenim,
  regionOfCity,
} from "@/lib/yks-sim/atlas-enrich";
import type { YokAtlasProgram } from "@/lib/universities/types";

const row = (parts: Partial<YokAtlasProgram>): YokAtlasProgram => ({
  Program_Kodu: "1",
  Puan_Tipi: "SAY",
  Universite: "ANKARA ÜNİVERSİTESİ",
  Sehir: "ANKARA",
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

describe("enrichAtlasBursTuru", () => {
  it("derives Burslu from Ek_Bilgi", () => {
    const [r] = enrichAtlasBursTuru([row({ Ek_Bilgi_1: "Burslu" })]);
    expect(r!.bursTuru).toBe("Burslu");
  });

  it("derives Burssuz from Ücretli (Turkish uppercase)", () => {
    const [r] = enrichAtlasBursTuru([row({ Ek_Bilgi_1: "Ücretli" })]);
    expect(r!.bursTuru).toBe("Burssuz");
  });

  it("derives discount tiers from Ek_Bilgi", () => {
    const rows = enrichAtlasBursTuru([
      row({ Program_Kodu: "a", Ek_Bilgi_1: "%50 İndirimli" }),
      row({ Program_Kodu: "b", Ek_Bilgi_1: "%25 İndirimli" }),
    ]);
    expect(rows[0]!.bursTuru).toBe("%50 Burslu");
    expect(rows[1]!.bursTuru).toBe("%25 Burslu");
  });
});

describe("matchesKurum", () => {
  it("identifies devlet university", () => {
    expect(matchesKurum(row({}), "devlet")).toBe(true);
    expect(matchesKurum(row({ Universite: "KOÇ ÜNİVERSİTESİ" }), "vakif")).toBe(true);
    expect(matchesKurum(row({ Universite: "KOÇ ÜNİVERSİTESİ" }), "devlet")).toBe(false);
  });
});

describe("matchesOgrenim", () => {
  it("excludes uzaktan from orgun", () => {
    expect(matchesOgrenim(row({ Bolum: "Hukuk Uzaktan" }), "orgun")).toBe(false);
    expect(matchesOgrenim(row({ Bolum: "Hukuk" }), "orgun")).toBe(true);
  });
});

describe("regionOfCity", () => {
  it("maps Istanbul to Marmara", () => {
    expect(regionOfCity("İSTANBUL")).toBe("Marmara");
  });
});
