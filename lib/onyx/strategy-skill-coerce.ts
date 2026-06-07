import type { StrategySkillData } from "@/lib/onyx/skill-types";

function toNum(v: unknown, fallback = 0): number {
  if (v == null || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function normalizeStrategyOncelik(
  v: unknown
): "kritik" | "yuksek" | "orta" {
  const s = String(v ?? "orta")
    .toLowerCase()
    .replace(/ü/g, "u")
    .replace(/ı/g, "i")
    .trim();
  if (s === "kritik" || s === "critical") return "kritik";
  if (s === "yuksek" || s === "yüksek" || s === "high") return "yuksek";
  return "orta";
}

export function normalizeStrategyGerceklik(
  v: unknown
): "yuksek" | "orta" | "dusuk" | "veri_yok" {
  const s = String(v ?? "orta")
    .toLowerCase()
    .replace(/ç/g, "c")
    .replace(/ı/g, "i")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ğ/g, "g")
    .replace(/\s+/g, "_")
    .trim();
  if (s === "yuksek" || s === "high") return "yuksek";
  if (s === "dusuk" || s === "low") return "dusuk";
  if (s === "veri_yok" || s === "veriyok" || s === "veri-yok") return "veri_yok";
  return "orta";
}

function normalizeHedefAnalizi(raw: unknown): Record<string, unknown> | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const h = raw as Record<string, unknown>;
  const prog = (h.program ?? h.programa) as Record<string, unknown> | undefined;
  if (!prog || typeof prog !== "object") return undefined;

  return {
    program: {
      universite: String(prog.universite ?? "—").trim() || "—",
      bolum: String(prog.bolum ?? "—").trim() || "—",
      puanTipi: String(prog.puanTipi ?? prog.puan_tipi ?? "").trim() || undefined,
      tabanPuani: String(prog.tabanPuani ?? prog.taban ?? "").trim() || undefined,
      basariSirasi: String(prog.basariSirasi ?? prog.sira ?? "").trim() || undefined,
      atlasKaynak: prog.atlasKaynak === true,
    },
    mevcutToplamNet: toNum(h.mevcutToplamNet ?? h.mevcut_net),
    hedefToplamNet: toNum(h.hedefToplamNet ?? h.hedef_net),
    netFarki: toNum(h.netFarki ?? h.net_farki),
    gerçekcilik: normalizeStrategyGerceklik(h.gerçekcilik ?? h.gerceklik),
    analiz: String(h.analiz ?? "").trim() || "—",
    tahminiSure: String(h.tahminiSure ?? h.tahmini_sure ?? "").trim() || undefined,
  };
}

function normalizeBransAnalizi(raw: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((b) => {
      if (!b || typeof b !== "object") return null;
      const row = b as Record<string, unknown>;
      const ders = String(row.ders ?? "").trim();
      const gerekce = String(row.gerekce ?? row.aciklama ?? "").trim();
      if (!ders || !gerekce) return null;
      return {
        ders,
        mevcutNet:
          row.mevcutNet != null ? toNum(row.mevcutNet) : undefined,
        hedefNet: row.hedefNet != null ? toNum(row.hedefNet) : undefined,
        oncelik: normalizeStrategyOncelik(row.oncelik),
        gerekce,
      };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
    .slice(0, 8);
}

function normalizeHaftalikGorevler(raw: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((t, i) => {
      if (!t || typeof t !== "object") return null;
      const row = t as Record<string, unknown>;
      const baslik = String(row.baslik ?? row.title ?? "").trim();
      if (!baslik) return null;
      return {
        id: String(row.id ?? `g-${i + 1}`),
        baslik,
        aciklama: String(row.aciklama ?? row.description ?? "").trim() || undefined,
        gun:
          typeof row.gun === "number"
            ? row.gun
            : toNum(row.dayIndex ?? row.gun, 0),
        sure: String(row.sure ?? row.duration ?? "").trim() || undefined,
        oncelik: normalizeStrategyOncelik(row.oncelik),
      };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
    .slice(0, 10);
}

/** generateObject / Zod öncesi — alias alanları birleştir, ekstra key'leri at */
export function preprocessStrategySkillEnvelope(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;

  const root = raw as Record<string, unknown>;
  let type = root.type;
  let data: Record<string, unknown>;

  if (root.data && typeof root.data === "object" && !Array.isArray(root.data)) {
    data = { ...(root.data as Record<string, unknown>) };
    type = type ?? "strategy";
  } else if (
    root.mevcutNet != null ||
    root.hedefNet != null ||
    root.haftalikGorevler != null ||
    root.haftalik_gorevler != null
  ) {
    data = { ...root };
    type = "strategy";
  } else {
    return raw;
  }

  const hedefAnalizi = normalizeHedefAnalizi(
    data.hedefAnalizi ?? data.hedef_analizi
  );
  const bransAnalizi = normalizeBransAnalizi(
    data.bransAnalizi ?? data.brans_analizi
  );
  const oncelikliKonularRaw = data.oncelikliKonular ?? data.oncelikli_konular;
  const oncelikliKonular = Array.isArray(oncelikliKonularRaw)
    ? oncelikliKonularRaw
        .map((k) => String(k).trim())
        .filter(Boolean)
        .slice(0, 8)
    : undefined;

  const haftalikGorevler = normalizeHaftalikGorevler(
    data.haftalikGorevler ?? data.haftalik_gorevler ?? data.gorevler
  );

  return {
    type: type === "strategy" ? "strategy" : "strategy",
    data: {
      mevcutNet: toNum(data.mevcutNet ?? data.mevcut_net),
      hedefNet: toNum(data.hedefNet ?? data.hedef_net),
      puanTipi:
        String(data.puanTipi ?? data.puan_tipi ?? "").trim() || undefined,
      ozet: String(data.ozet ?? data.summary ?? "").trim() || undefined,
      hedefAnalizi,
      bransAnalizi: bransAnalizi.length ? bransAnalizi : undefined,
      oncelikliKonular,
      koçNotu: String(
        data.koçNotu ?? data.kocNotu ?? data.koc_notu ?? ""
      ).trim() || undefined,
      haftalikGorevler,
    },
  };
}

export function ensureStrategyMinimums(
  data: StrategySkillData
): StrategySkillData {
  const tasks = data.haftalikGorevler?.length
    ? data.haftalikGorevler
    : [
        {
          id: "g1",
          baslik: "Zayıf konudan 40 soru",
          aciklama:
            "Paneldeki eksik konulardan bugün en kritik olanı seç ve çöz.",
          gun: 0,
          sure: "45 dk",
          oncelik: "kritik" as const,
        },
      ];

  return {
    ...data,
    ozet:
      data.ozet?.trim() ||
      "Deneme ve hedef verilerine göre net artışı için odaklı haftalık plan.",
    haftalikGorevler: tasks,
  };
}
