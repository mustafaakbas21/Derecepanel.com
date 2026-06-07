import { describe, expect, it } from "vitest";

import {
  applyExcelBundlesToMatrix,
  bundleToPreview,
  mergeExcelRowBundle,
  type ExcelRowBundle,
} from "@/lib/exams/excel-matrix";
import { decodeKonuCell } from "@/lib/exams/konu-cell";

function bundle(raw: Record<string, string>): ExcelRowBundle {
  const norm: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    const nk = k
      .toLowerCase()
      .replace(/ı/g, "i")
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "");
    if (nk) norm[nk] = v;
  }
  return { raw, norm };
}

describe("applyExcelBundlesToMatrix", () => {
  const empty = {
    cevaplar: Array(120).fill(""),
    zorluk: Array(120).fill("2"),
    konu: Array(120).fill(""),
    konuYazi: Array(120).fill(""),
  };

  it("maps Konu=ders adı, Kavram=müfredat konusu (ESKİ şablon)", () => {
    const rows = applyExcelBundlesToMatrix(
      [
        bundle({
          "Soru No": "1",
          "Doğru Cevap": "A",
          Konu: "Türkçe",
          Kavram: "Cümlede Anlam",
          Zorluk: "Kolay",
        }),
      ],
      "TYT",
      empty
    );

    expect(rows.cevaplar[0]).toBe("A");
    expect(rows.zorluk[0]).toBe("0");
    const decoded = decodeKonuCell(rows.konu[0] || "");
    expect(decoded.subjectId).toBeTruthy();
    expect(decoded.topicId).toBeTruthy();
    expect(rows.konuYazi[0]).toBe("");
  });

  it("falls back to free-text konuYazi when müfredat eşleşmez", () => {
    const rows = applyExcelBundlesToMatrix(
      [
        bundle({
          "Soru No": "2",
          "Doğru Cevap": "B",
          Konu: "Türkçe",
          Kavram: "Böyle Bir Konu Yok XYZ 999",
          Zorluk: "Zor",
        }),
      ],
      "TYT",
      empty
    );

    expect(rows.cevaplar[1]).toBe("B");
    expect(rows.zorluk[1]).toBe("2");
    expect(rows.konuYazi[1]).toContain("Böyle Bir Konu Yok XYZ 999");
  });

  it("reads Cevap column alias and topic-only in Konu column", () => {
    const b = bundle({
      "Soru No": "10",
      Cevap: "D",
      Konu: "Paragrafta Anlatım Biçimleri",
      Zorluk: "2",
    });
    const preview = bundleToPreview(b, 9);
    expect(preview.cevap).toBe("D");
    expect(preview.kavramLabel).toBe("");

    const rows = applyExcelBundlesToMatrix([b], "TYT", empty);
    expect(rows.cevaplar[9]).toBe("D");
    const decoded = decodeKonuCell(rows.konu[9] || "");
    expect(decoded.topicId || rows.konuYazi[9]).toBeTruthy();
  });

  it("merge keeps cevap/kavram when AOA row has empty standardized keys", () => {
    const jsonRow = bundle({
      "Soru No": "1",
      "Doğru Cevap": "B",
      Konu: "TYT Türkçe",
      Kavram: "Paragraf",
      Zorluk: "2",
    });
    const aoaRow = bundle({
      "Soru No": "1",
      "Doğru Cevap": "",
      Konu: "TYT Türkçe",
      Kavram: "",
      Zorluk: "2",
    });
    const preview = bundleToPreview(mergeExcelRowBundle(jsonRow, aoaRow), 0);
    expect(preview.cevap).toBe("B");
    expect(preview.kavramLabel).toBe("Paragraf");
  });

  it("preview does not duplicate Konu into Kavram when Kavram empty", () => {
    const preview = bundleToPreview(
      bundle({
        "Soru No": "3",
        "Doğru Cevap": "C",
        Konu: "Paragrafta Yardımcı Düşünce",
        Kavram: "",
      }),
      2
    );
    expect(preview.dersLabel).toBe("Paragrafta Yardımcı Düşünce");
    expect(preview.kavramLabel).toBe("");
    expect(preview.konuLabel).toBe("Paragrafta Yardımcı Düşünce");
  });
});
