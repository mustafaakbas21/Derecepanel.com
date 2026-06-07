import { describe, expect, it } from "vitest";

import { deriveDurum } from "@/lib/exams/enrich-exam";
import { buildTableList, todayIso } from "@/lib/exams/global-exam-calendar";
import {
  normalizeExamRow,
  persistGlobalExams,
} from "@/lib/exams/global-exam-storage";
import type { GlobalExam } from "@/lib/exams/types";

describe("normalizeExamRow", () => {
  it("syncs sinav/tur, ad/name, yayinevi default, atanan 0", () => {
    const row = normalizeExamRow({
      id: "gd-1",
      ad: "",
      name: "Test Deneme",
      tur: "AYT",
      tarih: "2026-06-01",
    });
    expect(row?.ad).toBe("Test Deneme");
    expect(row?.sinav).toBe("AYT");
    expect(row?.tur).toBe("AYT");
    expect(row?.yayinevi).toBe("—");
    expect(row?.atanan).toBe(0);
    expect(row?.scope).toBe("global");
  });
});

describe("buildTableList", () => {
  const ref = new Date("2026-05-28T12:00:00");

  const exams: GlobalExam[] = [
    {
      id: "gd-past",
      ad: "Geçmiş",
      tarih: "2026-05-01",
      saat: "09:00",
      sinav: "TYT",
      tur: "TYT",
      yayinevi: "—",
      atanan: 0,
      scope: "global",
    },
    {
      id: "gd-future",
      ad: "Gelecek",
      tarih: "2026-06-15",
      saat: "10:00",
      sinav: "TYT",
      tur: "TYT",
      yayinevi: "ÖSYM",
      atanan: 0,
      scope: "global",
    },
  ];

  it("yalnızca bugün ve sonrası", () => {
    const list = buildTableList(
      exams,
      { tur: "all", ay: "", search: "", yayinevi: "" },
      ref
    );
    expect(list).toHaveLength(1);
    expect(list[0]!.id).toBe("gd-future");
  });

  it("yayınevi filtresi", () => {
    const list = buildTableList(
      exams,
      { tur: "all", ay: "", search: "", yayinevi: "ÖSYM" },
      ref
    );
    expect(list).toHaveLength(1);
    expect(list[0]!.yayinevi).toBe("ÖSYM");
  });
});

describe("deriveDurum", () => {
  it("aktif when matrix 100% and pdf", () => {
    expect(deriveDurum(100, true)).toBe("aktif");
  });
});

describe("persistGlobalExams", () => {
  it("returns normalized list in node env", () => {
    const out = persistGlobalExams([
      {
        id: "gd-test",
        ad: "Deneme",
        tarih: todayIso(),
        saat: "09:00",
        sinav: "TYT",
        tur: "TYT",
        yayinevi: "—",
        atanan: 0,
        scope: "global",
      },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]!.atanan).toBe(0);
  });
});
