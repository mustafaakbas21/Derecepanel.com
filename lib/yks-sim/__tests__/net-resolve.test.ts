import { describe, expect, it } from "vitest";

import { enrichAtlasBursTuru } from "@/lib/yks-sim/atlas-enrich";
import {
  assignStrengthIndex,
  formatNsNet,
  getBranchSpec,
  netBand,
  resolveNets,
  syntheticNets,
} from "@/lib/yks-sim/net-resolve";
import type { YokAtlasProgram } from "@/lib/universities/types";

const baseRow = (overrides: Partial<YokAtlasProgram> = {}): YokAtlasProgram => ({
  Program_Kodu: "1",
  Puan_Tipi: "SAY",
  Universite: "TEST ÜNİ",
  Sehir: "ANKARA",
  Bolum: "Bilgisayar",
  Fakulte_YO: "",
  Ek_Bilgi_1: "",
  Ek_Bilgi_2: "",
  Sure_Yil: "4",
  Basari_2025: "1000",
  Basari_2024: "",
  Basari_2023: "",
  Taban_2025: "400",
  Taban_2024: "",
  Taban_2023: "",
  Basari_Sirasi_Guncel: "1000",
  Taban_Puani_Guncel: "400",
  Kontenjan_2025_Genel: "30",
  Kontenjan_2024_Genel: "",
  Kontenjan_2023_Genel: "",
  Kontenjan_Diger: "",
  Ozel_Kosul_Kodlari: "",
  Akreditasyon: "",
  Ek_Isaret: "",
  ...overrides,
});

describe("getBranchSpec", () => {
  it("returns TYT + SAY branches for SAY", () => {
    const spec = getBranchSpec("SAY");
    expect(spec.map((s) => s.id)).toContain("tyt_mat");
    expect(spec.map((s) => s.id)).toContain("ayt_fiz");
  });
});

describe("resolveNets", () => {
  it("uses model when no declared nets", () => {
    const rows = enrichAtlasBursTuru([
      baseRow({ Program_Kodu: "a", Taban_Puani_Guncel: "500" }),
      baseRow({ Program_Kodu: "b", Taban_Puani_Guncel: "400" }),
    ]);
    assignStrengthIndex(rows);
    const res = resolveNets(rows[0]!);
    expect(res.source).toBe("model");
    expect(res.spec.length).toBeGreaterThan(4);
    expect(res.bands.tyt_mat).toBeDefined();
  });

  it("uses json when ortalama_netler present", () => {
    const row = enrichAtlasBursTuru([baseRow()])[0]!;
    const withNets = {
      ...row,
      ortalama_netler: { "TYT Matematik": 32 },
    };
    assignStrengthIndex([withNets]);
    const res = resolveNets(withNets);
    expect(res.source).toBe("json");
    expect(res.nets.tyt_mat).toBe(32);
  });
});

describe("netBand", () => {
  it("model band is wider than json band", () => {
    const json = netBand(20, 40, "json");
    const model = netBand(20, 40, "model");
    expect(model.hi - model.lo).toBeGreaterThanOrEqual(json.hi - json.lo);
  });
});

describe("syntheticNets", () => {
  it("higher strength yields higher nets", () => {
    const spec = getBranchSpec("SAY");
    const low = syntheticNets(baseRow(), 0.2, spec);
    const high = syntheticNets(baseRow(), 0.9, spec);
    expect(high.nets.tyt_mat! > low.nets.tyt_mat!).toBe(true);
  });
});

describe("formatNsNet", () => {
  it("formats integers without decimal", () => {
    expect(formatNsNet(32)).toBe("32");
  });

  it("formats decimals with one place", () => {
    expect(formatNsNet(32.5)).toBe("32.5");
  });

  it("returns dash for invalid", () => {
    expect(formatNsNet(null)).toBe("—");
  });
});
