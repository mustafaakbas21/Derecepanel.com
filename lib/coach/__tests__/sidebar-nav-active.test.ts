import { describe, expect, it } from "vitest";

import {
  isCoachSubLinkActive,
  isCoachTopLinkActive,
} from "@/lib/coach/sidebar-nav-active";

describe("isCoachTopLinkActive", () => {
  it("Ana Sayfa yalnızca tam eşleşme", () => {
    expect(isCoachTopLinkActive("/dashboard", "/dashboard")).toBe(true);
    expect(isCoachTopLinkActive("/dashboard/ogrencilerim", "/dashboard")).toBe(false);
  });
});

describe("isCoachSubLinkActive", () => {
  const siblings = [
    "/dashboard/test-maker/olusturucu",
    "/dashboard/test-maker/kirpici",
    "/dashboard/test-maker/havuz",
  ];

  it("en uzun href kazanır", () => {
    expect(
      isCoachSubLinkActive("/dashboard/test-maker/kirpici", "/dashboard/test-maker/kirpici", {
        siblingHrefs: siblings,
      })
    ).toBe(true);
    expect(
      isCoachSubLinkActive("/dashboard/test-maker/kirpici", "/dashboard/test-maker/olusturucu", {
        siblingHrefs: siblings,
      })
    ).toBe(false);
  });

  it("modül kökü varsayılan çocuğa işaret eder", () => {
    expect(
      isCoachSubLinkActive("/dashboard/test-maker", "/dashboard/test-maker/olusturucu", {
        moduleRoot: "/dashboard/test-maker",
        defaultChildHref: "/dashboard/test-maker/olusturucu",
        siblingHrefs: siblings,
      })
    ).toBe(true);
  });

  it("Analiz merkezi denemeler kardeşlerinden ayrı", () => {
    const dnSiblings = [
      "/dashboard/denemeler/kurumsal",
      "/dashboard/analiz-merkezi",
    ];
    expect(
      isCoachSubLinkActive("/dashboard/analiz-merkezi", "/dashboard/analiz-merkezi", {
        siblingHrefs: dnSiblings,
      })
    ).toBe(true);
    expect(
      isCoachSubLinkActive("/dashboard/analiz-merkezi", "/dashboard/denemeler/kurumsal", {
        siblingHrefs: dnSiblings,
      })
    ).toBe(false);
  });
});
