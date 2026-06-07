/** Bölüm adına göre niteliksel sektör profili — uydurma istatistik yok */

export type IsBulmaSeviyesi = "yüksek" | "orta" | "değişken";
export type SektorTrendi = "yükselen" | "stabil" | "dönüşümde";

export type CareerSectorInsight = {
  isBulma: IsBulmaSeviyesi;
  sektorTrendi: SektorTrendi;
  /** 1–2 cümle, somut ama abartısız */
  ozet: string;
  calismaAlanlari: string[];
};

function norm(text: string): string {
  return text
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

type SectorRule = {
  test: RegExp;
  insight: CareerSectorInsight;
};

const SECTOR_RULES: SectorRule[] = [
  {
    test: /yönetim bilişim|ybs|isletme bilgi|business informatics/i,
    insight: {
      isBulma: "yüksek",
      sektorTrendi: "yükselen",
      ozet:
        "Kurumsal dijital dönüşüm, ERP/CRM ve veri odaklı karar süreçleri bu mezun profiline sürekli talep yaratıyor.",
      calismaAlanlari: ["BT danışmanlığı", "iş analisti", "proje/ürün yönetimi"],
    },
  },
  {
    test: /bilgisayar|yazılım|software|veri bilim|yapay zeka|siber/i,
    insight: {
      isBulma: "yüksek",
      sektorTrendi: "yükselen",
      ozet:
        "Yazılım, bulut ve yapay zeka yatırımları genişledikçe junior–mid pozisyonlar çok sayıda açılıyor; portföy ve staj kritik.",
      calismaAlanlari: ["yazılım geliştirme", "veri mühendisliği", "siber güvenlik"],
    },
  },
  {
    test: /endüstri|industrial/i,
    insight: {
      isBulma: "orta",
      sektorTrendi: "dönüşümde",
      ozet:
        "Üretim, lojistik ve operasyon optimizasyonunda analitik becerisi olan endüstri mezunları fabrika ve holdinglerde tercih ediliyor.",
      calismaAlanlari: ["operasyon", "tedarik zinciri", "süreç iyileştirme"],
    },
  },
  {
    test: /elektrik|elektronik|mekatronik/i,
    insight: {
      isBulma: "orta",
      sektorTrendi: "yükselen",
      ozet:
        "Enerji, otomasyon ve savunma sanayii projeleri elektronik/mekatronik altyapıya ihtiyaç duyuyor; teknik yetkinlik öne çıkıyor.",
      calismaAlanlari: ["otomasyon", "gömülü sistemler", "enerji altyapısı"],
    },
  },
  {
    test: /alternatif enerji|yenilenebilir|enerji sistem|güneş|ruzgar/i,
    insight: {
      isBulma: "orta",
      sektorTrendi: "yükselen",
      ozet:
        "Yeşil dönüşüm yatırımları artıyor; saha ve proje bazlı işler bölgesel, büyük ölçekli projelerde talep daha belirgin.",
      calismaAlanlari: ["enerji projeleri", "teknik saha", "sürdürülebilirlik"],
    },
  },
  {
    test: /makine/i,
    insight: {
      isBulma: "orta",
      sektorTrendi: "stabil",
      ozet:
        "Otomotiv, savunma ve imalat sektörlerinde tasarım–üretim hatlarında istihdam süregelir; CAD/CAE becerisi artı puan.",
      calismaAlanlari: ["tasarım", "üretim mühendisliği", "Ar-Ge"],
    },
  },
  {
    test: /tıp|hekim|dis hekim|eczac/i,
    insight: {
      isBulma: "yüksek",
      sektorTrendi: "stabil",
      ozet:
        "Sağlık hizmetleri kamu ve özel sektörde sürekli kadro açıyor; uzmanlık ve sınav süreçleri kariyer yolunu belirliyor.",
      calismaAlanlari: ["klinik", "araştırma", "sağlık yönetimi"],
    },
  },
  {
    test: /hemşire|saglik|fizyoterapi|odyoloji/i,
    insight: {
      isBulma: "yüksek",
      sektorTrendi: "stabil",
      ozet:
        "Hastane, rehabilitasyon ve evde bakım hizmetlerinde sağlık personeli açığı devam ediyor; vardiyalı çalışma yaygın.",
      calismaAlanlari: ["hastane", "rehabilitasyon", "evde bakım"],
    },
  },
  {
    test: /hukuk/i,
    insight: {
      isBulma: "değişken",
      sektorTrendi: "stabil",
      ozet:
        "Baro stajı ve uzmanlaşma sonrası gelir potansiyeli artar; ilk yıllarda ofis/staj deneyimi ve network belirleyici.",
      calismaAlanlari: ["hukuk bürosu", "kurumsal hukuk", "kamu"],
    },
  },
  {
    test: /işletme|iktisat|finans|bankacilik|muhasebe|maliye/i,
    insight: {
      isBulma: "orta",
      sektorTrendi: "dönüşümde",
      ozet:
        "Finans, perakende ve danışmanlık firmaları analitik düşünen mezun arıyor; dijital bankacılık alanı büyüyor.",
      calismaAlanlari: ["finans", "denetim", "satış/pazarlama"],
    },
  },
  {
    test: /mimarlık|iç mimar|sehir ve bolge|harita|insaat/i,
    insight: {
      isBulma: "değişken",
      sektorTrendi: "stabil",
      ozet:
        "İnşaat döngüsüne bağlı istihdam dalgalanır; proje ofisleri ve kamu ihalelerinde deneyim kazandıkça fırsat artar.",
      calismaAlanlari: ["proje ofisi", "şantiye", "kamu planlama"],
    },
  },
  {
    test: /psikoloji|rehberlik|pdr|sosyoloji/i,
    insight: {
      isBulma: "orta",
      sektorTrendi: "yükselen",
      ozet:
        "Okul PDR, kurumsal İK ve klinik alanlarda talep artıyor; lisans sonrası yüksek lisans/sertifika rekabeti güçlendiriyor.",
      calismaAlanlari: ["rehberlik", "İK", "klinik destek"],
    },
  },
  {
    test: /öğretmen|egitim|mathematics education|fen bilgisi/i,
    insight: {
      isBulma: "orta",
      sektorTrendi: "stabil",
      ozet:
        "Kamu atamaları kontenjan ve KPSS sıralamasına bağlı; özel sektörde kurs ve okul seçenekleri mevsimsel değişebilir.",
      calismaAlanlari: ["devlet okulu", "özel okul", "eğitim kurumu"],
    },
  },
  {
    test: /gıda|tarım|veteriner|ziraat/i,
    insight: {
      isBulma: "orta",
      sektorTrendi: "stabil",
      ozet:
        "Gıda güvenliği, tarım teknolojileri ve hayvancılık projelerinde teknik kadro ihtiyacı sürer; bölgesel fırsatlar önemli.",
      calismaAlanlari: ["gıda üretimi", "kalite kontrol", "tarım projeleri"],
    },
  },
  {
    test: /programcılık|bilgisayar program|web tasarım|grafik/i,
    insight: {
      isBulma: "orta",
      sektorTrendi: "yükselen",
      ozet:
        "Ön lisans mezunları destek ve uygulama ekiplerinde hızlı iş bulabilir; ilerlemek için sertifika ve portföy şart.",
      calismaAlanlari: ["destek birimi", "frontend", "dijital ajans"],
    },
  },
];

const DEFAULT_INSIGHT: CareerSectorInsight = {
  isBulma: "orta",
  sektorTrendi: "stabil",
  ozet:
    "Mezuniyet sonrası sektör, staj ve beceri setine göre değişir; taban puan tek başına kariyer garantisi vermez.",
  calismaAlanlari: ["özel sektör", "kamu", "Ar-Ge"],
};

export function getCareerSectorInsight(bolumAdi: string): CareerSectorInsight {
  const hay = norm(bolumAdi);
  for (const rule of SECTOR_RULES) {
    if (rule.test.test(hay)) return rule.insight;
  }
  return DEFAULT_INSIGHT;
}

/** Hedef bölüme yakın ama farklı alan arama terimleri */
export function getRelatedDepartmentSearchTerms(
  hedefBolum?: string
): string[] {
  const hay = norm(hedefBolum ?? "");
  if (!hay) {
    return ["Bilgisayar Mühendisliği", "Endüstri Mühendisliği", "İşletme"];
  }

  if (/yönetim bilişim|ybs/.test(hay)) {
    return [
      "Bilgisayar Mühendisliği",
      "Endüstri Mühendisliği",
      "İstatistik",
      "Ekonomi",
    ];
  }
  if (/bilgisayar|yazılım/.test(hay)) {
    return [
      "Yazılım Mühendisliği",
      "Yönetim Bilişim Sistemleri",
      "Elektrik Elektronik Mühendisliği",
      "Veri Bilimi",
    ];
  }
  if (/alternatif enerji|yenilenebilir/.test(hay)) {
    return [
      "Enerji Sistemleri Mühendisliği",
      "Çevre Mühendisliği",
      "Makine Mühendisliği",
      "Elektrik Elektronik Mühendisliği",
    ];
  }
  if (/tıp|dis hekim/.test(hay)) {
    return ["Hemşirelik", "Eczacılık", "Fizyoterapi", "Beslenme ve Diyetetik"];
  }
  if (/hukuk/.test(hay)) {
    return ["Uluslararası İlişkiler", "Siyaset Bilimi", "İşletme", "İktisat"];
  }
  if (/mimarlık|insaat/.test(hay)) {
    return [
      "İç Mimarlık",
      "Şehir ve Bölge Planlama",
      "Endüstri Ürünleri Tasarımı",
      "Peyzaj Mimarlığı",
    ];
  }
  if (/işletme|iktisat|finans/.test(hay)) {
    return [
      "Yönetim Bilişim Sistemleri",
      "Uluslararası Ticaret",
      "Ekonomi",
      "Lojistik Yönetimi",
    ];
  }
  if (/psikoloji|rehberlik/.test(hay)) {
    return ["Sosyoloji", "Sosyal Hizmet", "Çocuk Gelişimi", "İşletme"];
  }
  if (/makine|mekatronik/.test(hay)) {
    return [
      "Endüstri Mühendisliği",
      "Malzeme Bilimi",
      "Otomotiv Mühendisliği",
      "Enerji Sistemleri",
    ];
  }
  if (/elektrik|elektronik/.test(hay)) {
    return [
      "Bilgisayar Mühendisliği",
      "Mekatronik Mühendisliği",
      "Enerji Sistemleri",
      "Fizik Mühendisliği",
    ];
  }

  return ["Endüstri Mühendisliği", "İşletme", "Bilgisayar Mühendisliği"];
}

export function buildParlakNedenUygun(
  bolumAdi: string,
  tabanPuani?: string,
  puanTipi?: string
): { nedenUygun: string; isBulma: IsBulmaSeviyesi; sektorTrendi: SektorTrendi } {
  const insight = getCareerSectorInsight(bolumAdi);
  const tabanPart =
    tabanPuani?.trim() ?
      ` Atlas taban ${tabanPuani.trim()}${puanTipi ? ` (${puanTipi})` : ""}.`
    : "";
  const alanPart =
    insight.calismaAlanlari.length > 0
      ? ` Tipik çıkış: ${insight.calismaAlanlari.slice(0, 3).join(", ")}.`
      : "";
  return {
    nedenUygun: `${insight.ozet}${alanPart}${tabanPart}`,
    isBulma: insight.isBulma,
    sektorTrendi: insight.sektorTrendi,
  };
}

export function isBulmaLabel(seviye: IsBulmaSeviyesi): string {
  switch (seviye) {
    case "yüksek":
      return "İş bulma: Yüksek";
    case "orta":
      return "İş bulma: Orta";
    default:
      return "İş bulma: Değişken";
  }
}

export function sektorTrendiLabel(trend: SektorTrendi): string {
  switch (trend) {
    case "yükselen":
      return "Sektör: Yükselen";
    case "dönüşümde":
      return "Sektör: Dönüşümde";
    default:
      return "Sektör: Stabil";
  }
}
