import { describe, expect, it } from "vitest";

import { filterAtlasPrograms } from "@/lib/yks-sim/atlas-filter";
import type { YokAtlasProgram } from "@/lib/universities/types";

function row(overrides: Partial<YokAtlasProgram>): YokAtlasProgram {
  return {
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
    ...overrides,
  };
}

describe("filterAtlasPrograms universite", () => {
  it("matches display name from uniqueUniversities list", () => {
    const programs = [row({ Program_Kodu: "A", Universite: "HALİÇ", Bolum: "Tıp" })];
    const result = filterAtlasPrograms(programs, {
      universite: "HALİÇ Üniversitesi",
      limit: 50,
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.Program_Kodu).toBe("A");
  });

  it("returns empty when display name does not match raw-only includes", () => {
    const programs = [row({ Universite: "HALİÇ" })];
    const wrong = filterAtlasPrograms(programs, {
      universite: "BOĞAZİÇİ Üniversitesi",
      limit: 50,
    });
    expect(wrong).toHaveLength(0);
  });
});
