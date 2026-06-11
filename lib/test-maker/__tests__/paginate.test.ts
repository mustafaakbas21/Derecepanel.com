import { describe, expect, it } from "vitest";

import {
  FALLBACK_QUESTION_HEIGHT_PX,
  flattenPagesQuestionIds,
  paginateByMeasuredHeights,
  paginateForwardOnly,
  refineLayoutWithDom,
  type MeasuredQuestionPage,
} from "@/lib/test-maker/paginate";
import type { TMQuestion } from "@/lib/test-maker/types";

const COL_MAX = 400;

function q(id: string, heightKey = id): TMQuestion {
  return {
    id,
    imageDataUrl: `data:image/png;base64,${heightKey}`,
    answer: "A",
    fromHavuz: false,
  };
}

function heightsFor(ids: string[], px: number | Record<string, number>): Record<string, number> {
  const map: Record<string, number> = {};
  for (const id of ids) {
    map[id] = typeof px === "number" ? px : (px[id] ?? FALLBACK_QUESTION_HEIGHT_PX);
  }
  return map;
}

function layoutIds(pages: MeasuredQuestionPage[]): string[] {
  return flattenPagesQuestionIds(pages);
}

describe("paginateByMeasuredHeights", () => {
  it("fills left column top-to-bottom then right column", () => {
    const questions = [q("1"), q("2"), q("3"), q("4"), q("5")];
    const heights = heightsFor(["1", "2", "3", "4", "5"], 120);
    const pages = paginateByMeasuredHeights(questions, heights, COL_MAX);

    expect(pages[0]?.left.map((item) => item.id)).toEqual(["1", "2"]);
    expect(pages[0]?.right.map((item) => item.id)).toEqual(["3", "4"]);
    expect(pages[1]?.left.map((item) => item.id)).toEqual(["5"]);
    expect(pages[1]?.right).toEqual([]);
  });

  it("opens a new page when both columns are full", () => {
    const questions = [q("1"), q("2"), q("3"), q("4"), q("5")];
    const heights = heightsFor(["1", "2", "3", "4", "5"], 180);
    const pages = paginateByMeasuredHeights(questions, heights, COL_MAX);

    expect(layoutIds(pages)).toEqual(["1", "2", "3", "4", "5"]);
    expect(pages).toHaveLength(2);
    expect(pages[1]?.left.map((item) => item.id)).toEqual(["5"]);
  });

  it("packs variable counts per page from mixed question heights", () => {
    const questions = [q("big"), q("s1"), q("s2"), q("s3"), q("s4"), q("s5"), q("s6")];
    const heights = heightsFor(
      ["big", "s1", "s2", "s3", "s4", "s5", "s6"],
      { big: 350, s1: 55, s2: 55, s3: 55, s4: 55, s5: 55, s6: 55 }
    );
    const pages = paginateByMeasuredHeights(questions, heights, COL_MAX);

    expect(layoutIds(pages)).toEqual(["big", "s1", "s2", "s3", "s4", "s5", "s6"]);
    expect(pages[0]?.left.map((item) => item.id)).toEqual(["big"]);
    expect(pages[0]?.right.length).toBeGreaterThan(2);
    expect(pages[0]!.left.length + pages[0]!.right.length).toBeGreaterThan(4);
  });

  it("allows more small questions per page when heights are tiny", () => {
    const questions = [q("1"), q("2"), q("3"), q("4"), q("5"), q("6"), q("7"), q("8")];
    const heights = heightsFor(["1", "2", "3", "4", "5", "6", "7", "8"], 50);
    const pages = paginateByMeasuredHeights(questions, heights, COL_MAX);

    expect(pages[0]!.left.length + pages[0]!.right.length).toBeGreaterThanOrEqual(6);
  });

  it("keeps an oversized question alone in its column slot", () => {
    const questions = [q("1"), q("2")];
    const heights = heightsFor(["1", "2"], { "1": 520, "2": 80 });
    const pages = paginateByMeasuredHeights(questions, heights, COL_MAX);

    expect(pages[0]?.left.map((item) => item.id)).toEqual(["1"]);
    expect(pages[0]?.right.map((item) => item.id)).toEqual(["2"]);
  });
});

describe("paginateForwardOnly", () => {
  it("appends on the last page without moving earlier pages", () => {
    const base = [q("1"), q("2"), q("3"), q("4")];
    const heightsSmall = heightsFor(["1", "2", "3", "4"], 120);
    const previous = paginateByMeasuredHeights(base, heightsSmall, COL_MAX);

    const withNew = [...base, q("5")];
    const heights = { ...heightsSmall, "5": 120 };
    const next = paginateForwardOnly(withNew, heights, COL_MAX, previous);

    expect(previous[0]?.left.map((item) => item.id)).toEqual(["1", "2"]);
    expect(previous[0]?.right.map((item) => item.id)).toEqual(["3", "4"]);
    expect(next[0]?.left.map((item) => item.id)).toEqual(["1", "2"]);
    expect(next[0]?.right.map((item) => item.id)).toEqual(["3", "4"]);
    expect(layoutIds(next)).toEqual(["1", "2", "3", "4", "5"]);
    expect(next.at(-1)?.left.map((item) => item.id)).toContain("5");
  });

  it("keeps every settled question slot when only heights change", () => {
    const questions = [q("1"), q("2"), q("3"), q("4"), q("5")];
    const smallHeights = heightsFor(["1", "2", "3", "4", "5"], 120);
    const previous = paginateByMeasuredHeights(questions, smallHeights, COL_MAX);

    const largeHeights = { ...smallHeights, "5": 360 };
    const next = paginateForwardOnly(questions, largeHeights, COL_MAX, previous);

    expect(next).toEqual(previous);
  });

  it("places a large next question on the right when the left column is full", () => {
    const questions = [q("1"), q("2"), q("3")];
    const heights = heightsFor(["1", "2", "3"], { "1": 180, "2": 180, "3": 300 });
    const pages = paginateByMeasuredHeights(questions, heights, COL_MAX);

    expect(pages[0]?.left.map((item) => item.id)).toEqual(["1", "2"]);
    expect(pages[0]?.right.map((item) => item.id)).toEqual(["3"]);
  });

  it("opens a new page when both columns cannot fit the next question", () => {
    const questions = [q("1"), q("2"), q("3")];
    const heights = heightsFor(["1", "2", "3"], { "1": 180, "2": 180, "3": 410 });
    const pages = paginateByMeasuredHeights(questions, heights, COL_MAX);

    expect(pages[0]?.left.map((item) => item.id)).toEqual(["1", "2"]);
    expect(pages[0]?.right).toEqual([]);
    expect(pages[1]?.left.map((item) => item.id)).toEqual(["3"]);
  });
});

describe("refineLayoutWithDom", () => {
  it("never moves settled questions", () => {
    const questions = [q("1"), q("2"), q("3")];
    const heights = heightsFor(["1", "2", "3"], 120);
    const pages = paginateByMeasuredHeights(questions, heights, COL_MAX);
    const metrics = pages.map(() => ({
      left: { clientHeight: COL_MAX, usedHeight: COL_MAX + 100 },
      right: { clientHeight: COL_MAX, usedHeight: COL_MAX + 100 },
    }));

    expect(refineLayoutWithDom(pages, heights, metrics)).toBeNull();
  });
});
