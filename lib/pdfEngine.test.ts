import { describe, expect, it } from "vitest";

import {
  detectBookletType,
  parseAnswerKeyFromText,
  parseBookletRemap,
  findAnswerKeyStartIndex,
} from "@/lib/pdfEngine/answer-key";

describe("pdfEngine answer key v2", () => {
  it("parses numbered and spaced patterns", () => {
    const text = `
      CEVAP ANAHTARI
      1. A 2. B 3. C 4. D 5. E
      6) A 7) B 8) C 9 D 10 E
      11 A 12 B 13 C
    `;
    const map = parseAnswerKeyFromText(text, 120);
    expect(map.get(1)).toBe("A");
    expect(map.get(10)).toBe("E");
    expect(map.get(13)).toBe("C");
    expect(map.size).toBeGreaterThanOrEqual(10);
  });

  it("parses letter run after marker", () => {
    const letters = "ABCDE".repeat(8);
    const text = `CEVAP ANAHTARI\n${letters}`;
    const map = parseAnswerKeyFromText(text, 40);
    expect(map.get(1)).toBe("A");
    expect(map.get(5)).toBe("E");
    expect(map.get(6)).toBe("A");
    expect(map.size).toBeGreaterThanOrEqual(35);
  });

  it("parses grid number row + letter row", () => {
    const text = `
      CEVAP ANAHTARI
      1 2 3 4 5
      A B C D E
      6 7 8 9 10
      B A D C E
    `;
    const map = parseAnswerKeyFromText(text, 40);
    expect(map.get(1)).toBe("A");
    expect(map.get(5)).toBe("E");
    expect(map.get(6)).toBe("B");
    expect(map.get(10)).toBe("E");
  });

  it("finds answer key region near end", () => {
    const body = "1. Soru metni ".repeat(100);
    const tail = "CEVAP ANAHTARI 1.A 2.B 3.C";
    const full = body + tail;
    const idx = findAnswerKeyStartIndex(full);
    expect(idx).toBeGreaterThan(body.length - 50);
  });
});

describe("pdfEngine booklet", () => {
  it("detects booklet B", () => {
    expect(detectBookletType("Bu sinav B kitapcik icindir")).toBe("B");
  });

  it("parses remap table", () => {
    const remap = parseBookletRemap("1-3\n2-1\n3-2\n4-5", 10);
    expect(remap?.get(1)).toBe(3);
    expect(remap?.get(2)).toBe(1);
  });
});
