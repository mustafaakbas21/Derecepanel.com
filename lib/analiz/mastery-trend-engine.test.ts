import { describe, expect, it } from "vitest";

import {
  classifyTopicTrend,
  TREND_STATUS_SORT,
} from "@/lib/analiz/mastery-trend-engine";

describe("classifyTopicTrend", () => {
  it("veri yetersiz — 3 sorudan az geçmiş", () => {
    expect(classifyTopicTrend(80, 20, 2)).toBe("INSUFFICIENT_DATA");
  });

  it("kritik düşüş", () => {
    expect(classifyTopicTrend(65, 30, 10)).toBe("CRITICAL_DROP");
  });

  it("kronik eksik", () => {
    expect(classifyTopicTrend(20, 25, 12)).toBe("CHRONIC_WEAK");
  });

  it("kusursuz istikrarlı", () => {
    expect(classifyTopicTrend(85, 90, 15)).toBe("STABLE_HIGH");
  });

  it("yükseliş", () => {
    expect(classifyTopicTrend(40, 75, 20)).toBe("RISING");
  });
});

describe("TREND_STATUS_SORT", () => {
  it("kritik düşüş en üst öncelik", () => {
    expect(TREND_STATUS_SORT.CRITICAL_DROP).toBeLessThan(
      TREND_STATUS_SORT.CHRONIC_WEAK
    );
    expect(TREND_STATUS_SORT.STABLE_HIGH).toBeGreaterThan(
      TREND_STATUS_SORT.RISING
    );
  });
});
