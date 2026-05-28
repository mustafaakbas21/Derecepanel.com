import { describe, expect, it } from "vitest";

import { looksLikeDetailedTemplate } from "@/lib/students/import/detect";
import { normKey } from "@/lib/students/import/normalize";
import { canonicalizeRow, parseCsvText } from "@/lib/students/import/parse-file";
import { parseImportRows } from "@/lib/students/import/parse-rows";
import { applyStudentImport } from "@/lib/students/import/persist";

describe("normKey", () => {
  it("başlıkları küçük harf ve boşluksuz eşleştirir", () => {
    expect(normKey("TC Kimlik")).toBe("tckimlik");
    expect(normKey("Hedef Üniversite/Bölüm")).toBe("hedefuniversitebolum");
    expect(normKey("Öğrenci No")).toBe("ogrencino");
  });
});

describe("looksLikeDetailedTemplate", () => {
  it("detaylı şablonu algılar", () => {
    expect(
      looksLikeDetailedTemplate([
        "Öğrenci No",
        "Ad",
        "Soyad",
        "TC Kimlik",
        "Veli Ad Soyad",
      ])
    ).toBe(true);
  });
});

describe("parseCsvText — basit CSV", () => {
  const csv = `Ad,Soyad,TC,Sinif,Alan,Telefon,VeliTelefon,Hedef
Ali,Veli,12345678901,12,Sayısal,5321112233,5329998877,ODTÜ — Bilgisayar
Ayşe,Yılmaz,,11,Eşit,,,`;

  it("2 veri satırı okur", () => {
    const rows = parseCsvText(csv);
    expect(rows).toHaveLength(2);
  });

  it("2 geçerli öğrenci üretir", () => {
    const rows = parseCsvText(csv);
    const { students, skipped } = parseImportRows(rows);
    expect(students).toHaveLength(2);
    expect(skipped).toBe(0);
    expect(students[0].name).toBe("Ali Veli");
    expect(students[0].alan).toBe("sayisal");
    expect(students[1].alan).toBe("esit");
  });
});

describe("parseImportRows — örnek satır", () => {
  it("Örnek/Öğrenci satırını atlar", () => {
    const rawRows = [
      {
        "Öğrenci No": "ÖRN-001",
        Ad: "Örnek",
        Soyad: "Öğrenci",
        Alan: "Sayısal",
        "Veli Ad Soyad": "V",
        "Veli Telefon": "1",
      },
      {
        "Öğrenci No": "STU-002",
        Ad: "Gerçek",
        Soyad: "Öğrenci",
        Alan: "Sayısal",
        "Veli Ad Soyad": "Veli",
        "Veli Telefon": "532",
      },
    ];
    const { students, skipped } = parseImportRows(rawRows);
    expect(students).toHaveLength(1);
    expect(skipped).toBe(1);
    expect(students[0].name).toBe("Gerçek Öğrenci");
  });
});

describe("parseImportRows — boş", () => {
  it("boş liste hata döner", () => {
    const { students, errors } = parseImportRows([]);
    expect(students).toHaveLength(0);
    expect(errors[0]?.reason).toContain("satır");
  });
});

describe("applyStudentImport — mükerrer", () => {
  it("aynı öğrenci no ile skip eder", () => {
    const input = {
      studentCode: "DUP-001",
      name: "Test Öğrenci",
      sinifBranch: "12",
      alan: "sayisal" as const,
      parent: "Veli",
      parentPhone: "532",
      goal: "Hedef",
      status: "aktif" as const,
      kayitDate: "2026-05-27",
    };
    const first = applyStudentImport([input], []);
    expect(first.imported).toBe(1);

    const second = applyStudentImport([input], ["DUP-001"]);
    expect(second.imported).toBe(0);
    expect(second.skipped).toBe(1);
    expect(second.errors[0]?.reason).toContain("kayıtlı");
  });
});

describe("parseImportRows — detaylı 3 satır", () => {
  const rawRows = [
    {
      "Öğrenci No": "A-001",
      Ad: "Bir",
      Soyad: "Öğrenci",
      "TC Kimlik": "11111111111",
      Alan: "Sayısal",
      "Sınıf/Şube": "12-A",
      "Veli Ad Soyad": "Veli 1",
      "Veli Telefon": "5321111111",
      "Hedef Üniversite/Bölüm": "ODTÜ — BM",
    },
    {
      "Öğrenci No": "A-002",
      Ad: "İki",
      Soyad: "Öğrenci",
      Alan: "Sözel",
      "Veli Ad Soyad": "Veli 2",
      "Veli Telefon": "5322222222",
    },
    {
      "Öğrenci No": "A-003",
      Ad: "Üç",
      Soyad: "Öğrenci",
      Alan: "Dil",
      "Veli Ad Soyad": "Veli 3",
      "Veli Telefon": "5323333333",
    },
  ];

  it("3 öğrenci parse eder", () => {
    const { students } = parseImportRows(rawRows);
    expect(students).toHaveLength(3);
    expect(students[2].alan).toBe("dil");
  });
});
