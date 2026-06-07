import type {
  AnalyticsSkillData,
  AnalyticsTrendExamPoint,
} from "@/lib/onyx/skill-types";

export function parseHataOrani(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.min(100, Math.max(0, value));
  }
  const raw = String(value ?? "").replace(/%/g, "").trim();
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0;
}

function normalizeAnaliz(raw: unknown): AnalyticsSkillData["analiz"] {
  const a = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  return {
    gercekci_durum_ozeti: String(
      a.gercekci_durum_ozeti ??
        a.gercekciDurumOzeti ??
        a.ana_tespit ??
        a.anaTespit ??
        a.ozet ??
        ""
    ).trim(),
    kirmizi_alarm_durumu: String(
      a.kirmizi_alarm_durumu ??
        a.kirmiziAlarmDurumu ??
        a.kiritik_uyari ??
        a.kritik_uyari ??
        a.kritikUyari ??
        ""
    ).trim(),
  };
}

function normalizeTrendExamPoints(raw: unknown): AnalyticsTrendExamPoint[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((p) => {
      const row = p as Record<string, unknown>;
      const net = Number(row.net ?? row.tyt_net ?? row.tytNet);
      if (!Number.isFinite(net)) return null;

      const sinav = String(
        row.sinav ?? row.deneme ?? row.ad ?? row.label ?? row.name ?? ""
      ).trim();
      const tarih = String(
        row.tarih ?? row.date ?? row.ay ?? ""
      ).trim();

      if (!sinav && !tarih) return null;

      return {
        tarih: tarih || "—",
        sinav: sinav || tarih,
        net,
      };
    })
    .filter((x): x is AnalyticsTrendExamPoint => Boolean(x))
    .slice(0, 5);
}

function normalizeAksiyonRecetesi(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((s) => String(s).trim()).filter(Boolean).slice(0, 5);
  }
  const plan = String(raw ?? "").trim();
  if (!plan) return [];
  return plan
    .split(/\n+/)
    .map((s) => s.replace(/^\d+[\).\s-]+/, "").trim())
    .filter(Boolean)
    .slice(0, 5);
}

function fromMetinAnaliziSchema(
  data: Record<string, unknown>
): AnalyticsSkillData | null {
  const metinRaw =
    data.metin_analizi && typeof data.metin_analizi === "object"
      ? (data.metin_analizi as Record<string, unknown>)
      : data.metinAnalizi && typeof data.metinAnalizi === "object"
        ? (data.metinAnalizi as Record<string, unknown>)
        : undefined;

  const grafik = data.grafik_verileri ?? data.grafikVerileri;
  const g =
    grafik && typeof grafik === "object"
      ? (grafik as Record<string, unknown>)
      : {};

  const grafik_verisi_icin_trend = normalizeTrendExamPoints(
    g.trend_cizgisi ?? g.trendCizgisi ?? g.trend
  );

  const analiz = normalizeAnaliz({
    gercekci_durum_ozeti: metinRaw?.ana_tespit ?? metinRaw?.ozet,
    kirmizi_alarm_durumu:
      metinRaw?.kiritik_uyari ?? metinRaw?.kritik_uyari,
  });

  const aksiyon_recetesi = normalizeAksiyonRecetesi(
    data.aksiyon_recetesi ?? data.aksiyonRecetesi ?? metinRaw?.aksiyon_plani
  );

  if (
    !analiz.gercekci_durum_ozeti &&
    !analiz.kirmizi_alarm_durumu &&
    !grafik_verisi_icin_trend.length
  ) {
    return null;
  }

  return {
    analiz,
    grafik_verisi_icin_trend,
    aksiyon_recetesi: aksiyon_recetesi.length
      ? aksiyon_recetesi
      : ["Somut aksiyon maddesi üretilemedi."],
  };
}

/** Eski `{ trend, zayifKonular, uyarilar, ozet }` → yeni şema */
function fromLegacyAnalytics(
  data: Record<string, unknown>
): AnalyticsSkillData | null {
  const trend = Array.isArray(data.trend) ? data.trend : [];
  const grafik_verisi_icin_trend = trend
    .map((p) => {
      const row = p as Record<string, unknown>;
      const sinav = String(row.label ?? row.ad ?? row.sinav ?? "").trim();
      const net = Number(row.net);
      if (!sinav || !Number.isFinite(net)) return null;
      return { tarih: "—", sinav, net };
    })
    .filter((x): x is AnalyticsTrendExamPoint => Boolean(x));

  const uyarilar = Array.isArray(data.uyarilar) ? data.uyarilar : [];
  const ozet = String(data.ozet ?? "").trim();

  if (!grafik_verisi_icin_trend.length && !ozet && !uyarilar.length) {
    return null;
  }

  return {
    analiz: {
      gercekci_durum_ozeti: ozet || uyarilar[0] || "Trend verisi sınırlı.",
      kirmizi_alarm_durumu: uyarilar[0] || "Kritik alarm üretilemedi.",
    },
    grafik_verisi_icin_trend,
    aksiyon_recetesi: uyarilar.slice(1).length
      ? uyarilar.slice(1)
      : ["Haftalık tekrar planı oluştur."],
  };
}

export function normalizeAnalyticsSkillData(
  data: Record<string, unknown>
): AnalyticsSkillData | null {
  if (data.analiz || data.grafik_verisi_icin_trend || data.aksiyon_recetesi) {
    const analiz = normalizeAnaliz(data.analiz);
    const grafik_verisi_icin_trend = normalizeTrendExamPoints(
      data.grafik_verisi_icin_trend ?? data.grafikVerisiIcinTrend
    );
    const aksiyon_recetesi = normalizeAksiyonRecetesi(
      data.aksiyon_recetesi ?? data.aksiyonRecetesi
    );

    const hasContent =
      analiz.gercekci_durum_ozeti ||
      analiz.kirmizi_alarm_durumu ||
      grafik_verisi_icin_trend.length ||
      aksiyon_recetesi.length;

    if (hasContent) {
      return { analiz, grafik_verisi_icin_trend, aksiyon_recetesi };
    }
  }

  if (data.metin_analizi || data.grafik_verileri) {
    return fromMetinAnaliziSchema(data);
  }

  return fromLegacyAnalytics(data);
}

/** Grafik ekseni etiketi */
export function analyticsTrendChartLabel(point: AnalyticsTrendExamPoint): string {
  if (point.tarih && point.tarih !== "—") {
    return point.sinav.length > 14
      ? `${point.tarih}`
      : `${point.tarih} · ${point.sinav}`;
  }
  return point.sinav;
}

/** İlk → son net farkı (pozitif = yükseliş) */
export function computeTrendDelta(
  points: AnalyticsTrendExamPoint[]
): number | null {
  if (points.length < 2) return null;
  return points[points.length - 1]!.net - points[0]!.net;
}
