import { describe, expect, it } from "vitest";

import {
  computeTrendDelta,
  normalizeAnalyticsSkillData,
  parseHataOrani,
} from "@/lib/onyx/analytics-normalize";

describe("parseHataOrani", () => {
  it("parses percent strings", () => {
    expect(parseHataOrani("%70")).toBe(70);
    expect(parseHataOrani("55")).toBe(55);
  });
});

describe("normalizeAnalyticsSkillData", () => {
  it("parses başarı analisti schema", () => {
    const out = normalizeAnalyticsSkillData({
      analiz: {
        gercekci_durum_ozeti: "34 netten 0'a düşüş",
        kirmizi_alarm_durumu: "ODTÜ hedefi ile 0 net kriz",
      },
      grafik_verisi_icin_trend: [
        { tarih: "Aralık 2025", sinav: "TYT 2", net: 34.5 },
        { tarih: "Mayıs 2026", sinav: "Leylak TYT", net: 0 },
      ],
      aksiyon_recetesi: ["Temel matematiğe dön", "Denemeyi durdur"],
    });
    expect(out?.grafik_verisi_icin_trend[0]?.net).toBe(34.5);
    expect(out?.analiz.kirmizi_alarm_durumu).toContain("ODTÜ");
    expect(out?.aksiyon_recetesi).toHaveLength(2);
  });

  it("migrates metin_analizi schema", () => {
    const out = normalizeAnalyticsSkillData({
      metin_analizi: {
        ana_tespit: "Türkçe düşüyor",
        kiritik_uyari: "Paragraf",
        aksiyon_plani: "1. Tekrar\n2. Test",
      },
      grafik_verileri: {
        trend_cizgisi: [{ deneme: "D1", tyt_net: 60, ayt_net: 25 }],
      },
    });
    expect(out?.analiz.gercekci_durum_ozeti).toBe("Türkçe düşüyor");
    expect(out?.grafik_verisi_icin_trend[0]?.net).toBe(60);
  });

  it("migrates legacy analytics payload", () => {
    const out = normalizeAnalyticsSkillData({
      trend: [{ label: "TYT-1", net: 50 }],
      uyarilar: ["Uyarı"],
      ozet: "Özet",
    });
    expect(out?.analiz.gercekci_durum_ozeti).toBe("Özet");
    expect(out?.grafik_verisi_icin_trend[0]?.sinav).toBe("TYT-1");
  });
});

describe("computeTrendDelta", () => {
  it("computes net change", () => {
    expect(
      computeTrendDelta([
        { tarih: "A", sinav: "1", net: 34 },
        { tarih: "B", sinav: "2", net: 0 },
      ])
    ).toBe(-34);
  });
});
