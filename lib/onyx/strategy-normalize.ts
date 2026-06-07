import type { CareerAtlasRow } from "@/lib/onyx/career-types";
import type {
  StrategyHedefAnalizi,
  StrategySkillData,
} from "@/lib/onyx/skill-types";

/** TYT tek oturum net tavanı — üzerindeki değerler puan/sıra karışıklığıdır */
const MAX_TYT_NET = 120;

function normalizeTr(s: string): string {
  return s
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .trim();
}

function parseBasariSirasi(raw?: string): number | null {
  const cleaned = String(raw ?? "")
    .replace(/\./g, "")
    .replace(/,/g, "")
    .trim();
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseTabanPuani(raw?: string): number | null {
  const n = Number(String(raw ?? "").replace(",", ".").trim());
  return Number.isFinite(n) && n > 50 ? n : null;
}

/** Başarı sırası bandından gerçekçi TYT net hedefi (puan değil) */
export function estimateHedefTytNetFromBasariSirasi(sira: number): number {
  if (sira <= 300) return 105;
  if (sira <= 1000) return 98;
  if (sira <= 3000) return 92;
  if (sira <= 10000) return 85;
  if (sira <= 30000) return 78;
  if (sira <= 100000) return 70;
  return 62;
}

/** AI bazen taban puanı veya sırayı net sanıyor — düzelt */
export function sanitizeHedefTytNet(
  raw: number,
  mevcut: number,
  basariSirasi?: string,
  tabanPuani?: string
): number {
  const sira = parseBasariSirasi(basariSirasi);
  const taban = parseTabanPuani(tabanPuani);

  const fromSira =
    sira != null ? estimateHedefTytNetFromBasariSirasi(sira) : 90;

  if (!Number.isFinite(raw) || raw <= 0) {
    return Math.max(fromSira, mevcut);
  }

  const looksLikePuan =
    raw > MAX_TYT_NET ||
    raw > 200 ||
    (taban != null && Math.abs(raw - taban) < 80) ||
    (sira != null && Math.abs(raw - sira) < 100);

  if (looksLikePuan) {
    return Math.max(fromSira, mevcut);
  }

  return Math.max(Math.min(raw, MAX_TYT_NET), mevcut);
}

function pickBestAtlasMatch(
  programs: CareerAtlasRow[],
  universite?: string,
  bolum?: string
): CareerAtlasRow | null {
  if (programs.length === 0) return null;
  const u = normalizeTr(universite ?? "");
  const b = normalizeTr(bolum ?? "");

  let best: { score: number; row: CareerAtlasRow } | null = null;
  for (const row of programs) {
    let score = 0;
    const ru = normalizeTr(row.universite);
    const rb = normalizeTr(row.bolum);
    if (b && rb.includes(b)) score += 10;
    if (b && b.includes(rb.slice(0, Math.min(8, rb.length)))) score += 6;
    if (u && ru.includes(u)) score += 8;
    if (u && u.includes(ru.split(" ")[0] ?? "")) score += 4;
    if (score > 0 && (!best || score > best.score)) {
      best = { score, row };
    }
  }
  return best?.row ?? programs[0] ?? null;
}

function parseGerçekcilik(
  raw: unknown
): StrategyHedefAnalizi["gerçekcilik"] {
  const t = String(raw ?? "orta").trim().toLowerCase();
  if (t === "yuksek" || t === "yüksek") return "yuksek";
  if (t === "dusuk" || t === "düşük") return "dusuk";
  if (t.includes("veri")) return "veri_yok";
  return "orta";
}

function buildAnalizMetni(
  program: StrategyHedefAnalizi["program"],
  mevcutTyt: number | null,
  hedefTyt: number,
  sonAyt: number | null | undefined
): string {
  const sira = program.basariSirasi || "—";
  const taban = program.tabanPuani || "—";
  const aytLine =
    sonAyt != null && Number.isFinite(sonAyt)
      ? ` Son kurumsal AYT netin ${sonAyt}.`
      : "";

  if (mevcutTyt == null || !Number.isFinite(mevcutTyt)) {
    return (
      `${program.universite} — ${program.bolum}: YÖK Atlas başarı sırası ${sira}, taban puan ${taban} ` +
      `(bunlar yerleştirme puanı/sırasıdır, deneme neti değildir). ` +
      `TYT deneme netin henüz kayıtlı değil; bu bölüm bandı için tahmini TYT hedefi ~${hedefTyt} net. ` +
      `Net farkı hesaplanmadı.${aytLine}`
    );
  }

  const netFark = Math.max(0, hedefTyt - mevcutTyt);

  return (
    `${program.universite} — ${program.bolum}: YÖK Atlas başarı sırası ${sira}, taban puan ${taban} ` +
    `(bunlar yerleştirme puanı/sırasıdır, deneme neti değildir). ` +
    `Kurumsal son TYT netin ${mevcutTyt}; bu bölüm bandı için tahmini TYT hedefi ~${hedefTyt} net ` +
    `(+${netFark} net).${aytLine}`
  );
}

/** AI çıktısını Atlas + kurumsal deneme verisi ile zenginleştir */
export function enrichStrategyFromGroundTruth(
  data: StrategySkillData,
  options: {
    atlasPrograms: CareerAtlasRow[];
    panelUniversite?: string;
    panelBolum?: string;
    sonTyTNet?: number | null;
    sonAytNet?: number | null;
    /** @deprecated sonTyTNet kullanın */
    sonDenemeNet?: number | null;
    /** Supabase'te kayıt yok — mock/AI net kullanma */
    denemeVerisiBilinmiyor?: boolean;
  }
): StrategySkillData {
  const denemeBilinmiyor = options.denemeVerisiBilinmiyor === true;

  const groundTyT =
    !denemeBilinmiyor &&
    options.sonTyTNet != null &&
    Number.isFinite(options.sonTyTNet)
      ? Number(options.sonTyTNet)
      : !denemeBilinmiyor &&
          options.sonDenemeNet != null &&
          Number.isFinite(options.sonDenemeNet)
        ? Number(options.sonDenemeNet)
        : null;

  const sonAyt =
    !denemeBilinmiyor &&
    options.sonAytNet != null &&
    Number.isFinite(options.sonAytNet)
      ? Number(options.sonAytNet)
      : denemeBilinmiyor
        ? null
        : data.sonAytNet ?? null;

  const mevcutTyt = denemeBilinmiyor ? null : groundTyT;

  const hasRealDeneme =
    !denemeBilinmiyor &&
    (mevcutTyt != null || sonAyt != null);

  const hasTyt = mevcutTyt != null && Number.isFinite(mevcutTyt);

  const match = pickBestAtlasMatch(
    options.atlasPrograms,
    data.hedefAnalizi?.program?.universite ?? options.panelUniversite,
    data.hedefAnalizi?.program?.bolum ?? options.panelBolum
  );

  let hedefAnalizi = data.hedefAnalizi;
  const tabanStr = match?.tabanPuani ?? hedefAnalizi?.program?.tabanPuani;
  const siraStr = match?.basariSirasi ?? hedefAnalizi?.program?.basariSirasi;

  const hedefTyt = sanitizeHedefTytNet(
    data.hedefNet,
    mevcutTyt ?? 0,
    siraStr,
    tabanStr
  );

  if (match) {
    const program = {
      universite: match.universite,
      bolum: match.bolum,
      puanTipi: match.puanTipi || hedefAnalizi?.program?.puanTipi,
      tabanPuani: match.tabanPuani || hedefAnalizi?.program?.tabanPuani,
      basariSirasi: match.basariSirasi || hedefAnalizi?.program?.basariSirasi,
      atlasKaynak: true as const,
    };

    const netFarki = hasTyt ? Math.max(0, hedefTyt - mevcutTyt!) : 0;

    hedefAnalizi = {
      program,
      mevcutToplamNet: hasTyt ? mevcutTyt! : 0,
      hedefToplamNet: hedefTyt,
      netFarki,
      gerçekcilik: hedefAnalizi?.gerçekcilik ?? parseGerçekcilik(undefined),
      analiz:
        hedefAnalizi?.analiz?.trim() &&
        !/\b400\s*net\b/i.test(hedefAnalizi.analiz) &&
        !/taban.*net fark/i.test(hedefAnalizi.analiz)
          ? hedefAnalizi.analiz
          : buildAnalizMetni(program, mevcutTyt, hedefTyt, sonAyt),
      tahminiSure: hedefAnalizi?.tahminiSure,
    };

    if (!hasTyt) hedefAnalizi.gerçekcilik = "veri_yok";
    else if (netFarki <= 15) hedefAnalizi.gerçekcilik = "yuksek";
    else if (netFarki <= 35) hedefAnalizi.gerçekcilik = "orta";
    else hedefAnalizi.gerçekcilik = "dusuk";
  } else if (!hedefAnalizi && (options.panelUniversite || options.panelBolum)) {
    hedefAnalizi = {
      program: {
        universite: options.panelUniversite || "—",
        bolum: options.panelBolum || "—",
        atlasKaynak: false,
      },
      mevcutToplamNet: hasTyt ? mevcutTyt! : 0,
      hedefToplamNet: hedefTyt,
      netFarki: hasTyt ? Math.max(0, hedefTyt - mevcutTyt!) : 0,
      gerçekcilik: "veri_yok",
      analiz:
        "Hedef bölüm panelde kayıtlı ancak YÖK Atlas eşleşmesi bulunamadı. Taban puan uydurulmadı.",
    };
  } else if (hedefAnalizi) {
    hedefAnalizi = {
      ...hedefAnalizi,
      mevcutToplamNet: hasTyt ? mevcutTyt! : 0,
      hedefToplamNet: hedefTyt,
      netFarki: hasTyt ? Math.max(0, hedefTyt - mevcutTyt!) : 0,
    };
  }

  const hasDeneme = hasRealDeneme;
  let ozet = data.ozet?.trim();
  if (denemeBilinmiyor || !hasDeneme) {
    ozet =
      "Öğrencinin henüz sisteme girilmiş deneme verisi yok. Mevcut net bilinmiyor; hedef farkı hesaplanmadı.";
  } else if (hasTyt && sonAyt != null) {
    ozet = `Kurumsal denemeler: TYT ${mevcutTyt} net, AYT ${sonAyt} net.`;
  } else if (hasTyt) {
    ozet = `Kurumsal denemeler: TYT ${mevcutTyt} net. AYT denemesi henüz kayıtlı değil.`;
  } else if (sonAyt != null) {
    ozet = `TYT deneme neti kayıtlı değil. Son AYT netin ${sonAyt}. TYT net farkı hesaplanmadı.`;
  } else if (hasDeneme && ozet === "Deneme verisi yok") {
    ozet = "Deneme verisi kısmen mevcut; TYT/AYT netleri ayrı ayrı kontrol edildi.";
  }

  return {
    ...data,
    mevcutNet: hasTyt ? mevcutTyt! : 0,
    hedefNet: hedefTyt,
    sonTyTNet: hasTyt ? mevcutTyt : null,
    sonAytNet: sonAyt,
    hedefTyTNet: hedefTyt,
    ozet,
    puanTipi:
      data.puanTipi || match?.puanTipi || hedefAnalizi?.program?.puanTipi,
    hedefAnalizi,
  };
}
