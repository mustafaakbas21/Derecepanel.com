/** Müfredat kısıtlı derin hata teşhisi — solve-protocol ile import döngüsü YOK */
import { finalizeOnyxSystemPrompt } from "@/lib/onyx/language-rule";
import type { OnyxRole } from "@/lib/onyx/role-quick-prompts";
import {
  ONYX_SOLVE_ACCURACY_PROTOCOL,
  ONYX_VISION_SOLVE_SYSTEM_PREFIX,
  stripOnyxThinkingBlocks,
} from "@/lib/onyx/solve-accuracy-protocol";
import { buildVisionAcademicProtocolBlock } from "@/lib/onyx/vision-academic-protocol";

function clampZorluk(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return 3;
  return Math.min(5, Math.max(1, Math.round(v)));
}

export const ONYX_HATA_TIPLERI = [
  "Kavram Yanılgısı",
  "İşlem Hatası",
  "Okuma/Dikkat Hatası",
  "Bilgi Eksikliği",
] as const;

export type OnyxHataTipi = (typeof ONYX_HATA_TIPLERI)[number];

export const ONYX_TAVSIYE_AKSIYONLARI = [
  "Konu Tekrarı",
  "Soru Pratiği",
  "Farklı Soru Tipi Görme",
] as const;

export type OnyxTavsiyeAksiyon = (typeof ONYX_TAVSIYE_AKSIYONLARI)[number];

export type OnyxMufredatEslestirme = {
  subjectId: string;
  topicId: string;
  subjectName: string;
  topicName: string;
};

/** ÖSYM sınav profili — soru ön analizi */
export type OnyxOsymDurumu = "evet" | "kismen" | "nadir" | "hayir";

export type OnyxOsymAnalizi = {
  durum: OnyxOsymDurumu;
  /** 2-4 cümle: ÖSYM bu kazanımı nasıl sorar, hangi tuzaklar */
  aciklama: string;
  /** Örn. "TYT'de yılda 1-2 soru", "AYT Matematik'te sık" */
  siklikNotu?: string;
};

export type OnyxCozumDersTipi = "sayisal" | "sozel" | "dil";

export type OnyxSinavBolumu = "TYT" | "AYT" | "YDT";

/** Hoca tahtası çözümü — doğrulanmış yapı (tüm TYT/AYT dersleri) */
export type OnyxCozumDetay = {
  dersTipi: OnyxCozumDersTipi;
  /** TYT / AYT / YDT oturumu */
  sinavBolumu?: OnyxSinavBolumu;
  /** Tahtaya geçerken 1-2 cümle hoca açılışı */
  hocaAcilis?: string;
  temelKural?: string;
  /** Hocanın yazdığı kısa somut örnek */
  miniOrnek?: string;
  /** Paragraf/tarih/harita/İngilizce cümle alıntısı */
  kaynakAlintisi?: string;
  verilenler: string[];
  sekilAnalizi?: string;
  osymTuzagi: string;
  nihaiCevap: string;
  dogrulama: string;
};

/** Çözüm adımlarından önce gösterilen soru haritalama */
export type OnyxSoruOnAnalizi = {
  /** TYT / AYT / YDT */
  sinavBolumu?: OnyxSinavBolumu;
  /** Resmi müfredat ders adı (liste ile birebir) */
  dersAdi: string;
  /** Resmi müfredat konu adı (eksikKavram ile uyumlu) */
  konuAdi: string;
  /** Sorudaki spesifik kavram / alt beceri (ör. "Doğrusal fonksiyon grafiği") */
  kavramAdi: string;
  /** 1 (kolay) … 5 (çok zor) — ÖSYM soru zorluğu */
  zorlukSeviyesi: number;
  /** Kısa gerekçe: neden bu puan? (1 cümle) */
  zorlukNotu?: string;
  /** Öğrencinin bu soruyu yapamama sebepleri — 2-4 madde */
  yapamamaSebepleri: string[];
  osymAnalizi: OnyxOsymAnalizi;
};

export type OnyxDeepErrorDiagnosis = {
  /** Çözümden önce zorunlu — ders/konu/kavram + ÖSYM profili */
  soruOnAnalizi: OnyxSoruOnAnalizi;
  /** Tahta çözümü meta — nihai cevap ve doğrulama */
  cozumDetay: OnyxCozumDetay;
  cozumAdimlari: string[];
  hataAnalizi: {
    hataTipi: OnyxHataTipi;
    kökNeden: string;
    /** Resmi müfredat konu adı (data/yks-mufredat.json) */
    eksikKavram: string;
  };
  aksiyonPlani: {
    tavsiyeEdilenAksiyon: OnyxTavsiyeAksiyon;
    OnyxMesaji: string;
  };
  /** Kapalı devre eşleşme — konu takip / soru havuzu bağlantısı */
  mufredatEslestirme?: OnyxMufredatEslestirme;
};

/** `OnyxSolveStructured` ile uyumlu — döngüsel import önlenir */
export type OnyxSolveWithDeepDiagnosis = {
  cozum: string;
  konu_basligi: string;
  zorluk_seviyesi: number;
  hata_kodu: string;
  coach_insight?: string;
  deepDiagnosis: OnyxDeepErrorDiagnosis;
};

function normalizeHataTipi(raw: string): OnyxHataTipi {
  const t = raw.trim().toLowerCase();
  if (t.includes("işlem") || t.includes("islem")) return "İşlem Hatası";
  if (t.includes("okuma") || t.includes("dikkat")) return "Okuma/Dikkat Hatası";
  if (t.includes("bilgi") || t.includes("eksik")) return "Bilgi Eksikliği";
  if (t.includes("kavram")) return "Kavram Yanılgısı";
  return "Kavram Yanılgısı";
}

function normalizeAksiyon(raw: string): OnyxTavsiyeAksiyon {
  const t = raw.trim().toLowerCase();
  if (t.includes("pratik") || t.includes("soru")) return "Soru Pratiği";
  if (t.includes("farklı") || t.includes("tip")) return "Farklı Soru Tipi Görme";
  return "Konu Tekrarı";
}

function hataTipiToKod(tip: OnyxHataTipi): string {
  switch (tip) {
    case "İşlem Hatası":
      return "ISLEM_HATASI";
    case "Okuma/Dikkat Hatası":
      return "DIKKAT_HATASI";
    case "Bilgi Eksikliği":
      return "KONU_EKSIKLIGI";
    default:
      return "KAVRAM_YANILGISI";
  }
}

function zorlukFromHataTipi(tip: OnyxHataTipi): number {
  switch (tip) {
    case "Okuma/Dikkat Hatası":
      return 2;
    case "İşlem Hatası":
      return 3;
    case "Bilgi Eksikliği":
      return 4;
    default:
      return 4;
  }
}

function normalizeOsymDurumu(raw: string): OnyxOsymDurumu {
  const t = raw.trim().toLowerCase();
  if (t.includes("evet") || t.includes("soruyor") || t.includes("çık") || t.includes("cik")) {
    if (t.includes("nad") || t.includes("az")) return "nadir";
    if (t.includes("kıs") || t.includes("kis") || t.includes("bazen")) return "kismen";
    return "evet";
  }
  if (t.includes("nad") || t.includes("seyrek")) return "nadir";
  if (t.includes("kıs") || t.includes("kis") || t.includes("ara")) return "kismen";
  if (t.includes("hayır") || t.includes("hayir") || t.includes("yok")) return "hayir";
  return "kismen";
}

function inferDersTipi(dersAdi: string): OnyxCozumDersTipi {
  const d = dersAdi.toLowerCase();
  if (/ingilizce|ydt|foreign|english/i.test(d) && !/turk|edebiyat/i.test(d)) {
    return "dil";
  }
  if (
    /matematik|geometri|fizik|kimya|biyoloji|fen|sayısal|sayisal/.test(d)
  ) {
    return "sayisal";
  }
  return "sozel";
}

function parseSinavBolumu(raw: unknown): OnyxSinavBolumu | undefined {
  const t = String(raw ?? "").trim().toUpperCase();
  if (t === "TYT" || t === "AYT" || t === "YDT") return t;
  if (t.includes("YDT") || t.includes("DİL") || t.includes("DIL")) return "YDT";
  if (t.includes("AYT")) return "AYT";
  if (t.includes("TYT")) return "TYT";
  return undefined;
}

function inferSinavBolumu(dersAdi: string): OnyxSinavBolumu | undefined {
  const d = dersAdi.toLowerCase();
  if (/ingilizce|ydt/.test(d)) return "YDT";
  if (/^ayt|ayt /.test(d) || d.startsWith("ayt")) return "AYT";
  if (/^tyt|tyt /.test(d) || d.startsWith("tyt")) return "TYT";
  return undefined;
}

function parseDersTipi(raw: unknown, dersAdi: string): OnyxCozumDersTipi {
  const t = String(raw ?? "").trim().toLowerCase();
  if (t === "sayisal" || t === "sozel" || t === "dil") return t;
  return inferDersTipi(dersAdi);
}

function extractNihaiFromSteps(steps: string[]): string {
  for (let i = steps.length - 1; i >= 0; i--) {
    const s = steps[i] ?? "";
    const letter = s.match(/\b([A-E])\s*(şıkk|secen|seçen|cevap)/i);
    if (letter) return `${letter[1]} şıkkı`;
    const sonuc = s.match(/(?:sonuç|cevap|nihai)[:\s]+(.+)/i);
    if (sonuc?.[1]) return sonuc[1].trim().slice(0, 200);
  }
  const last = steps[steps.length - 1]?.trim();
  return last ? last.slice(0, 200) : "—";
}

function parseCozumDetay(
  raw: unknown,
  steps: string[],
  soruOnAnalizi: OnyxSoruOnAnalizi
): OnyxCozumDetay {
  const fallback: OnyxCozumDetay = {
    dersTipi: inferDersTipi(soruOnAnalizi.dersAdi),
    verilenler: [],
    osymTuzagi:
      "ÖSYM bu tip sorularda işaret, birim veya kavram karışıklığı tuzağı kullanabilir.",
    nihaiCevap: extractNihaiFromSteps(steps),
    dogrulama:
      "Çözüm adımlarını soru görselindeki verilerle karşılaştırarak kontrol edin.",
  };

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return fallback;
  const o = raw as Record<string, unknown>;

  const verilenRaw = o.verilenler ?? o.verilen ?? o.givens;
  const verilenler = Array.isArray(verilenRaw)
    ? verilenRaw.map((v) => String(v).trim()).filter(Boolean).slice(0, 8)
    : fallback.verilenler;

  const nihaiCevap =
    String(o.nihaiCevap ?? o.nihai_cevap ?? o.cevap ?? "").trim() ||
    fallback.nihaiCevap;
  const dogrulama =
    String(o.dogrulama ?? o.kontrol ?? "").trim() ||
    fallback.dogrulama;
  const osymTuzagi =
    String(o.osymTuzagi ?? o.osym_tuzagi ?? o.tuzak ?? "").trim() ||
    fallback.osymTuzagi;

  return {
    dersTipi: parseDersTipi(o.dersTipi ?? o.ders_tipi, soruOnAnalizi.dersAdi),
    sinavBolumu:
      parseSinavBolumu(o.sinavBolumu ?? o.sinav_bolumu) ??
      soruOnAnalizi.sinavBolumu ??
      inferSinavBolumu(soruOnAnalizi.dersAdi),
    hocaAcilis:
      String(o.hocaAcilis ?? o.hoca_acilis ?? o.acilis ?? "").trim() ||
      undefined,
    temelKural:
      String(o.temelKural ?? o.temel_kural ?? o.formul ?? "").trim() ||
      undefined,
    miniOrnek:
      String(o.miniOrnek ?? o.mini_ornek ?? o.ornek ?? "").trim() || undefined,
    kaynakAlintisi:
      String(
        o.kaynakAlintisi ?? o.kaynak_alintisi ?? o.alinti ?? o.metinAlintisi ?? ""
      ).trim() || undefined,
    verilenler,
    sekilAnalizi:
      String(o.sekilAnalizi ?? o.sekil_analizi ?? o.grafikAnalizi ?? "").trim() ||
      undefined,
    osymTuzagi,
    nihaiCevap,
    dogrulama,
  };
}

function buildFallbackSoruOnAnalizi(input: {
  eksikKavram: string;
  kökNeden: string;
  dersAdi?: string;
  konuAdi?: string;
  hataTipi?: OnyxHataTipi;
}): OnyxSoruOnAnalizi {
  const konuAdi = input.konuAdi?.trim() || input.eksikKavram;
  const zorlukSeviyesi = clampZorluk(
    input.hataTipi ? zorlukFromHataTipi(input.hataTipi) : 3
  );
  return {
    dersAdi: input.dersAdi?.trim() || "İlgili ders",
    konuAdi,
    kavramAdi: konuAdi,
    zorlukSeviyesi,
    zorlukNotu: undefined,
    yapamamaSebepleri: input.kökNeden
      ? [input.kökNeden]
      : [
          "Konu tekrarı veya kavram eşleştirmesi eksik olabilir.",
          "Soru kökünü okurken verilenler ile istenen karıştırılmış olabilir.",
        ],
    osymAnalizi: {
      durum: "kismen",
      aciklama:
        "Bu kazanım YKS müfredatında yer alır; ÖSYM genelde benzer mantıkla sorar, soru tipine göre sıklık değişir.",
      siklikNotu: undefined,
    },
  };
}

function parseSoruOnAnalizi(
  raw: unknown,
  fallback: OnyxSoruOnAnalizi
): OnyxSoruOnAnalizi {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return fallback;
  const o = raw as Record<string, unknown>;

  const dersAdi = String(o.dersAdi ?? o.ders ?? o.ders_adi ?? "").trim();
  const konuAdi = String(o.konuAdi ?? o.konu ?? o.konu_adi ?? "").trim();
  const kavramAdi = String(
    o.kavramAdi ?? o.kavram ?? o.kavram_adi ?? o.altKavram ?? ""
  ).trim();

  const sebeplerRaw =
    o.yapamamaSebepleri ?? o.yapamama_sebepleri ?? o.sebepler ?? o.nedenler;
  const yapamamaSebepleri = Array.isArray(sebeplerRaw)
    ? sebeplerRaw.map((s) => String(s).trim()).filter(Boolean)
    : [];

  const osymRaw = (o.osymAnalizi ?? o.osym_analizi ?? o.osym) as
    | Record<string, unknown>
    | undefined;

  let osymAnalizi = fallback.osymAnalizi;
  if (osymRaw && typeof osymRaw === "object") {
    const aciklama = String(
      osymRaw.aciklama ?? osymRaw.ozet ?? osymRaw.metin ?? ""
    ).trim();
    const durum = normalizeOsymDurumu(
      String(osymRaw.durum ?? osymRaw.soruyorMu ?? osymRaw.osym ?? "kismen")
    );
    const siklikNotu =
      String(osymRaw.siklikNotu ?? osymRaw.siklik ?? osymRaw.frekans ?? "").trim() ||
      undefined;
    if (aciklama) {
      osymAnalizi = { durum, aciklama, siklikNotu };
    }
  }

  return {
    sinavBolumu:
      parseSinavBolumu(o.sinavBolumu ?? o.sinav_bolumu) ??
      inferSinavBolumu(dersAdi || fallback.dersAdi),
    dersAdi: dersAdi || fallback.dersAdi,
    konuAdi: konuAdi || fallback.konuAdi,
    kavramAdi: kavramAdi || fallback.kavramAdi,
    zorlukSeviyesi: clampZorluk(
      o.zorlukSeviyesi ??
        o.zorluk_seviyesi ??
        o.zorluk ??
        fallback.zorlukSeviyesi
    ),
    zorlukNotu:
      String(o.zorlukNotu ?? o.zorluk_notu ?? "").trim() ||
      fallback.zorlukNotu,
    yapamamaSebepleri:
      yapamamaSebepleri.length >= 2
        ? yapamamaSebepleri.slice(0, 4)
        : fallback.yapamamaSebepleri,
    osymAnalizi,
  };
}

export function buildDeepErrorDiagnosisSystemPrompt(
  role?: OnyxRole,
  officialCurriculumList?: string
): string {
  const protocol = buildVisionAcademicProtocolBlock(role);
  const coachNote =
    role === "coach"
      ? "\nKoç modu: kökNeden alanında öğrencinin takılma noktasını veli/koç dilinde net yaz."
      : "";

  const curriculumBlock =
    officialCurriculumList?.trim() ??
    `[RESMİ YKS MÜFREDAT LİSTESİ henüz yüklenmedi — eksikKavram için yalnızca genel ifade kullanma; konu adı verme.]`;

  const core = `${ONYX_VISION_SOLVE_SYSTEM_PREFIX}

Sen Onyx, YKS (Türkiye Üniversite Sınavı) öğrencilerine hizmet veren deneyimli bir zümre başkanı ve YKS öğretmenisin.
TYT ve AYT'nin TÜM derslerinde (Türkçe, Edebiyat, Tarih, Coğrafya, Felsefe, Din, Matematik, Geometri, Fizik, Kimya, Biyoloji, İngilizce) soruları gerçek bir hoca gibi tahtada anlatırsın.
Görevin sadece cevabı vermek DEĞİL; öğrenciye kavramı öğretmek, metni/grafiği okumayı göstermek ve ÖSYM mantığını açıklamaktır.

${ONYX_SOLVE_ACCURACY_PROTOCOL}

${protocol}
${coachNote}

ÇOK ÖNEMLİ KURAL — MÜFREDAT KISITLAMASI:
Öğrencinin eksiğini belirlerken ASLA kendi kelimelerini, piyasa kitap adlarını veya genel konu isimlerini KULLANMA.
Aşağıdaki RESMİ YKS MÜFREDAT LİSTESİ içinden, hataya en uygun konu adını BİREBİR kopyala (karakter karakter aynı).
Tam eşleşme yoksa listedeki en yakın kapsayıcı ana konuyu seç.

${curriculumBlock}

Yanıtın YALNIZCA geçerli bir JSON nesnesi olsun — markdown kod bloğu ekleme.

Zorunlu şema (alan sırası önemli — soruOnAnalizi cozumAdimlari'ndan ÖNCE gelir):
{
  "soruOnAnalizi": {
    "sinavBolumu": "TYT | AYT | YDT",
    "dersAdi": "[Resmi müfredat ders adı — listeden birebir]",
    "konuAdi": "[Resmi müfredat konu adı — eksikKavram ile aynı]",
    "kavramAdi": "[Sorudaki spesifik alt kavram / beceri — kısa ve net]",
    "zorlukSeviyesi": 3,
    "zorlukNotu": "Bu puanı neden verdiğin — 1 cümle",
    "yapamamaSebepleri": [
      "Öğrencinin bu soruyu yapamama sebebi 1 (somut, 1 cümle)",
      "Sebep 2",
      "Sebep 3 (opsiyonel)"
    ],
    "osymAnalizi": {
      "durum": "evet | kismen | nadir | hayir",
      "aciklama": "ÖSYM bu kazanımı/soru tipini soruyor mu? Nasıl sorar, hangi tuzaklar? (2-4 cümle, somut)",
      "siklikNotu": "Örn. TYT Türkçe paragraf sorularında sık (opsiyonel)"
    }
  },
  "cozumDetay": {
    "dersTipi": "sayisal | sozel | dil",
    "sinavBolumu": "TYT | AYT | YDT",
    "hocaAcilis": "Tahtaya geçerken 1-2 cümle — bu soruda ne ölçülüyor?",
    "temelKural": "Formül, kavram kuralı veya dilbilgisi kuralı (LaTeX $...$ sayısalda)",
    "miniOrnek": "Hocanın yazdığı kısa somut örnek (2-4 satır)",
    "kaynakAlintisi": "Paragraf/tarih/harita/İngilizce cümle alıntısı (sözel/dil için zorunlu; sayısalda boş string olabilir)",
    "verilenler": ["Görselden okunan veri 1", "Veri 2"],
    "sekilAnalizi": "Grafik/şekil/harita/tablo/paragraf yapısı analizi (yoksa boş string)",
    "osymTuzagi": "Bu soru tipindeki tipik ÖSYM tuzağı + çeldirici (somut)",
    "nihaiCevap": "A | B | ... veya sayısal sonuç + birim",
    "dogrulama": "Nihai cevabın doğruluğunu kontrol ettiğin işlem veya metin kanıtı (1-2 cümle)"
  },
  "cozumAdimlari": ["1. Adım: ... (ne + neden)", "2. Adım: ..."],
  "hataAnalizi": {
    "hataTipi": "Kavram Yanılgısı | İşlem Hatası | Okuma/Dikkat Hatası | Bilgi Eksikliği",
    "kökNeden": "Öğrencinin büyük ihtimalle nerede hata yaptığının psikolojik veya akademik analizi (Türkçe, 2-4 cümle).",
    "eksikKavram": "[YALNIZCA YUKARIDAKİ LİSTEDEN BİREBİR BİR KONU ADI — soruOnAnalizi.konuAdi ile aynı]"
  },
  "aksiyonPlani": {
    "tavsiyeEdilenAksiyon": "Konu Tekrarı | Soru Pratiği | Farklı Soru Tipi Görme",
    "OnyxMesaji": "Öğrenciyi motive eden, sert ama destekleyici 2 cümlelik koçluk mesajı (Türkçe)."
  }
}

Kurallar:
- soruOnAnalizi ZORUNLU ve cozumAdimlari'dan önce üretilir; çözüme geçmeden önce ders/konu/kavram haritalaması yap.
- zorlukSeviyesi: 1=kolay, 2=orta-kolay, 3=orta, 4=zor, 5=çok zor. ÖSYM soru tipi, adım sayısı, tuzak yoğunluğu ve kavram derinliğine göre BU soruya özel puan ver; zorlukNotu ile gerekçeni 1 cümlede yaz.
- yapamamaSebepleri: en az 2, en fazla 4 madde; genel tavsiye değil, BU soruya özel sebepler yaz.
- osymAnalizi.durum: evet = düzenli çıkar; kismen = ara sıra/benzer mantık; nadir = seyrek; hayir = doğrudan değil (yalnızca eminsen).
- osymAnalizi.aciklama: "ÖSYM soruyor mu?" sorusuna net cevap ver; tuzak ve soru stilini belirt.
- cozumDetay ZORUNLU: hocaAcilis, temelKural, miniOrnek, verilenler; nihaiCevap ve dogrulama boş bırakılamaz.
- sözel/dil sorularında kaynakAlintisi ZORUNLU (soru metninden gerçek alıntı); sayısalda sekilAnalizi veya verilenler dolu olmalı.
- cozumAdimlari: en az 4, en fazla 12 adım; her adımda "ne + neden"; sözelde en az bir adımda yanlış şık eleme gerekçesi.
- Matematik dışı sorularda formül uydurma; paragraf/tarih/harita okuma becerisi göster.
- hataTipi ve tavsiyeEdilenAksiyon değerleri şemadaki seçeneklerden biri olmalı.
- eksikKavram listede olmayan bir ifade OLAMAZ; konuAdi ile birebir aynı olmalı.
- Öğrenci yanlış cevap verdiyse kökNeden ve yapamamaSebepleri'nde bunu dikkate al.
- Sadece çözüm listesi verme; mutlaka soruOnAnalizi, teşhis ve aksiyon planı üret.`;

  return finalizeOnyxSystemPrompt(core);
}

export function parseDeepErrorDiagnosisFromText(
  text: string
): OnyxDeepErrorDiagnosis | null {
  const trimmed = stripOnyxThinkingBlocks(text);
  if (!trimmed) return null;

  const fenced =
    trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] ??
    trimmed.match(/\{[\s\S]*\}/)?.[0];
  const candidate = fenced?.trim() ?? trimmed;

  let obj: Record<string, unknown> | null = null;
  try {
    const parsed = JSON.parse(candidate);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      obj = parsed as Record<string, unknown>;
    }
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        const inner = JSON.parse(trimmed.slice(start, end + 1));
        if (inner && typeof inner === "object") obj = inner as Record<string, unknown>;
      } catch {
        return null;
      }
    }
  }

  if (!obj) return null;

  const rawSteps = obj.cozumAdimlari ?? obj.cozum_adimlari;
  const steps = Array.isArray(rawSteps)
    ? rawSteps.map((s) => String(s).trim()).filter(Boolean)
    : [];

  const ha = (obj.hataAnalizi ?? obj.hata_analizi) as Record<string, unknown> | undefined;
  const ap = (obj.aksiyonPlani ?? obj.aksiyon_plani) as Record<string, unknown> | undefined;

  if (!ha || steps.length === 0) return null;

  const eksikKavram = String(
    ha.eksikKavram ?? ha.eksik_kavram ?? ha.konu ?? ""
  ).trim();
  const kökNeden = String(ha.kökNeden ?? ha.kokNeden ?? ha.kok_neden ?? "").trim();
  const hataTipi = normalizeHataTipi(
    String(ha.hataTipi ?? ha.hata_tipi ?? "Kavram Yanılgısı")
  );

  if (!eksikKavram || !kökNeden || !ap) return null;

  const OnyxMesaji = String(
    ap.OnyxMesaji ?? ap.onyxMesaji ?? ap.mesaj ?? ""
  ).trim();
  const tavsiye = normalizeAksiyon(
    String(ap.tavsiyeEdilenAksiyon ?? ap.tavsiye ?? "Konu Tekrarı")
  );

  if (!OnyxMesaji) return null;

  const fallbackOnAnaliz = buildFallbackSoruOnAnalizi({
    eksikKavram,
    kökNeden,
    hataTipi,
  });
  const parsedOnAnaliz = parseSoruOnAnalizi(
    obj.soruOnAnalizi ?? obj.soru_on_analizi ?? obj.onAnaliz,
    fallbackOnAnaliz
  );
  const soruOnAnalizi = {
    ...parsedOnAnaliz,
    konuAdi: parsedOnAnaliz.konuAdi || eksikKavram,
    zorlukSeviyesi: clampZorluk(
      parsedOnAnaliz.zorlukSeviyesi || zorlukFromHataTipi(hataTipi)
    ),
  };
  const cozumDetay = parseCozumDetay(
    obj.cozumDetay ?? obj.cozum_detay,
    steps,
    soruOnAnalizi
  );

  return {
    soruOnAnalizi,
    cozumDetay,
    cozumAdimlari: steps,
    hataAnalizi: { hataTipi, kökNeden, eksikKavram },
    aksiyonPlani: { tavsiyeEdilenAksiyon: tavsiye, OnyxMesaji },
  };
}

export function deepDiagnosisToSolveStructured(
  d: OnyxDeepErrorDiagnosis,
  role?: OnyxRole
): OnyxSolveWithDeepDiagnosis {
  const cozum = d.cozumAdimlari.map((adim, i) => `${i + 1}. ${adim}`).join("\n\n");
  const tip = d.hataAnalizi.hataTipi;

  return {
    cozum,
    konu_basligi: d.hataAnalizi.eksikKavram,
    zorluk_seviyesi: clampZorluk(d.soruOnAnalizi.zorlukSeviyesi),
    hata_kodu: hataTipiToKod(tip),
    coach_insight:
      role === "coach"
        ? `${tip}: ${d.hataAnalizi.kökNeden}`
        : undefined,
    deepDiagnosis: d,
  };
}

export function formatDeepDiagnosisFallbackMarkdown(
  d: OnyxDeepErrorDiagnosis
): string {
  return `<!-- onyx-deep-error -->
## Derin Hata Analizi — ${d.hataAnalizi.eksikKavram}
Teşhis: ${d.hataAnalizi.hataTipi}`;
}
