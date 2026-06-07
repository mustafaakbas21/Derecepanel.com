import { describe, expect, it } from "vitest";

import { hydrateTaramaTransferFromPool } from "@/lib/test-maker/intake";
import type { QuestionPoolItem } from "@/lib/test-maker/types";

describe("hydrateTaramaTransferFromPool", () => {
  it("uuid ile havuzdan soru üretir", () => {
    const pool: QuestionPoolItem[] = [
      {
        uuid: "q-1",
        dataUrl: "data:image/png;base64,abc",
        answer: "B",
        ders: "Mat",
        konu: "K",
        kavram: "",
        savedAt: "2026-01-01",
      },
    ];
    const out = hydrateTaramaTransferFromPool(
      { v: 2, items: [{ uuid: "q-1", answer: "C" }] },
      pool
    );
    expect(out).toHaveLength(1);
    expect(out[0]?.imageDataUrl).toBe("data:image/png;base64,abc");
    expect(out[0]?.answer).toBe("C");
  });

  it("havuzda olmayan uuid atlanır", () => {
    const out = hydrateTaramaTransferFromPool(
      { v: 2, items: [{ uuid: "missing", answer: "A" }] },
      []
    );
    expect(out).toHaveLength(0);
  });
});
