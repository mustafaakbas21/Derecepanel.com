import { describe, expect, it } from "vitest";

import {
  chartVerticalBarHeight,
  chartYAxisWidth,
  shortenChartLabel,
} from "@/lib/analiz/chart-labels";

describe("shortenChartLabel", () => {
  it("uzun bölüm adını kısaltır", () => {
    const long =
      "AYT Türk Dili ve Edebiyatı – Sosyal Bilimler-1 — Coğrafya-1";
    const out = shortenChartLabel(long, 36);
    expect(out.length).toBeLessThanOrEqual(36);
    expect(out).toContain("Coğrafya");
  });
});

describe("chartVerticalBarHeight", () => {
  it("çok satırda yüksekliği artırır", () => {
    const h = chartVerticalBarHeight(12, ["a".repeat(40)]);
    expect(h).toBeGreaterThanOrEqual(12 * 48);
  });
});

describe("chartYAxisWidth", () => {
  it("uzun etiketlerde geniş eksen", () => {
    const w = chartYAxisWidth(["AYT Matematik — Limit ve Süreklilik"], 36);
    expect(w).toBeGreaterThan(140);
  });
});
