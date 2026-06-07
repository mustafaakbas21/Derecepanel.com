import { describe, expect, it } from "vitest";

import { parseBookImportRows } from "@/lib/library/import/parse-rows";

describe("parseBookImportRows", () => {
  it("parses valid row and skips example", () => {
    const { books, errors, skipped } = parseBookImportRows([
      {
        "Kitap Adı": "Örnek Kitap",
        Yayınevi: "Örnek Yayın",
        Tür: "Soru Bankası",
        Ders: "TYT Matematik",
      },
      {
        "Kitap Adı": "Limit Test 1",
        Yayınevi: "Acil Yayınları",
        Tür: "Soru Bankası",
        Ders: "TYT Matematik",
        Konular: "Limit ve Süreklilik",
        "Zorluk (1-5)": "4",
      },
    ]);

    expect(errors).toHaveLength(0);
    expect(skipped).toBe(1);
    expect(books).toHaveLength(1);
    expect(books[0]?.title).toBe("Limit Test 1");
    expect(books[0]?.kind).toBe("soru-bankasi");
    expect(books[0]?.difficulty).toBe(4);
  });

  it("rejects unknown subject", () => {
    const { books, errors } = parseBookImportRows([
      {
        "Kitap Adı": "X",
        Yayınevi: "Y",
        Tür: "Deneme",
        Ders: "Böyle Bir Ders Yok",
      },
    ]);
    expect(books).toHaveLength(0);
    expect(errors[0]?.reason).toMatch(/Ders bulunamadı/);
  });
});
