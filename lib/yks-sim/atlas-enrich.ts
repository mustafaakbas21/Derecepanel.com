import {
  buildAtlasSearchText,
  deriveBolumDili,
  formatUniversiteDisplayName,
  hasDepremKontenjan,
  type BolumDili,
} from "@/lib/yks-sim/atlas-program-display";
import type { YokAtlasProgram } from "@/lib/universities/types";

export type BursTuru = "Burslu" | "%50 Burslu" | "%25 Burslu" | "Burssuz";

export type YokAtlasProgramEnriched = YokAtlasProgram & {
  bursTuru?: BursTuru;
  universiteDisplay?: string;
  bolumDili?: BolumDili;
  depremKontenjan?: boolean;
  _search?: string;
  _nsStrength?: number;
};

export function trUpper(s: string): string {
  return String(s || "").toLocaleUpperCase("tr-TR");
}

export function normPuanTip(t: string): string {
  return String(t || "")
    .toUpperCase()
    .replace(/İ/g, "I")
    .replace(/İ/g, "I")
    .replace(/ı/g, "I")
    .replace(/Ö/g, "O")
    .replace(/ö/g, "O")
    .replace(/Ü/g, "U")
    .replace(/ü/g, "U")
    .replace(/Ş/g, "S")
    .replace(/ş/g, "S")
    .replace(/Ğ/g, "G")
    .replace(/ğ/g, "G")
    .replace(/Ç/g, "C")
    .replace(/ç/g, "C")
    .trim();
}

const VAKIF_FRAGMENTS = [
  "VAKIF",
  " KOÇ",
  "KOÇ",
  "BİLKENT",
  "BILKENT",
  "SABANCI",
  "ÖZYEĞİN",
  "ÖZYEGIN",
  "OZYEGIN",
  "BAHÇEŞEHİR",
  "BAHCESEHIR",
  "MEDİPOL",
  "MEDIPOL",
  "YEDİTEPE",
  "YEDITEPE",
  "İSTİNYE",
  "ISTINYE",
  "ÜSKÜDAR",
  "USKUDAR",
  "BEYKOZ",
  "NİŞANTAŞI",
  "NISANTASI",
  "ACIBADEM",
  "LOKMAN HEKİM",
  "LOKMAN HEKIM",
  "İBNİ SİNA",
  "IBNI SINA",
  "UFUK",
  "ATILIM",
  "TOBB ETÜ",
  "TOBB ETU",
  "FATİH SULTAN",
  "FATIH SULTAN",
  "OKAN ",
  "AREL",
  "BEYKENT",
  "MALTEPE ",
  "YAŞAR",
  "YASAR",
  "İSTANBUL BİLGİ",
  "ISTANBUL BILGI",
  "PİRİ REİS",
  "PIRI REIS",
  "KADİR HAS",
  "KADIR HAS",
  "HALİÇ",
  "HALIC",
  "DOĞU AKDENİZ",
  "DOGU AKDENIZ",
  "ZİRVE",
  "ZIRVE",
  "İHSAN DOĞRAMACI",
  "IHSAN DOGRAMACI",
  "BEZM-İ ÂLEM",
  "BEZM-I ALEM",
  "TİCARİ BİLİMLER",
  "TICARI BILIMLER",
  "ANTALYA BİLİM",
  "ANTALYA BILIM",
  "İSTANBUL GELİŞİM",
  "ISTANBUL GELISIM",
  "ANKARA MEDİPOL",
  "ANKARA MEDIPOL",
  "İSTANBUL KENT",
  "ISTANBUL KENT",
  "BAŞKENT",
  "BASKENT",
] as const;

export function isVakifUniversity(name: string): boolean {
  const u = trUpper(name);
  for (const frag of VAKIF_FRAGMENTS) {
    if (u.includes(trUpper(frag))) return true;
  }
  return false;
}

export function rowTextBlob(row: YokAtlasProgram): string {
  return trUpper(
    [row.Bolum, row.Fakulte_YO, row.Ek_Bilgi_1, row.Ek_Bilgi_2, row.Universite].join(" ")
  );
}

export function isKKTCRow(row: YokAtlasProgram): boolean {
  const s = rowTextBlob(row);
  return (
    s.includes("KKTC") ||
    s.includes("KIBRIS") ||
    s.includes("GAZIMAGUSA") ||
    s.includes("LEFKOSA") ||
    s.includes("LEFKOŞA") ||
    s.includes("GÜZELYURT") ||
    s.includes("KUZEY KIBRIS")
  );
}

export function isYurtdisiRow(row: YokAtlasProgram): boolean {
  if (isKKTCRow(row)) return false;
  const s = rowTextBlob(row);
  const keys = [
    "YURT DIŞI",
    "YURTDIŞI",
    "MÜNİH",
    "MUNIH",
    "BERLİN",
    "BERLIN",
    "PARİS",
    "PARIS",
    "BAKÜ",
    "BAKU",
    "MOSKOVA",
    "ROMA",
    "LONDRA",
    "AMERİKA",
    "AMERIKA",
    "İTALYA",
    "ITALYA",
    "UKRAYNA",
    "BELÇİKA",
    "BELCIKA",
  ];
  return keys.some((k) => s.includes(k));
}

export function matchesKurum(row: YokAtlasProgram, kurumVal: string): boolean {
  if (!kurumVal) return true;
  const kktc = isKKTCRow(row);
  const yd = isYurtdisiRow(row);
  const vak = isVakifUniversity(row.Universite);
  if (kurumVal === "kktc") return kktc;
  if (kurumVal === "yurtdisi") return yd;
  if (kurumVal === "devlet") return !vak && !kktc && !yd;
  if (kurumVal === "vakif") return vak && !kktc;
  return true;
}

export function matchesOgrenim(row: YokAtlasProgram, ogVal: string): boolean {
  if (!ogVal) return true;
  const b = rowTextBlob(row);
  if (ogVal === "orgun") {
    if (b.includes("UZAKTAN")) return false;
    if (b.includes("AÇIKÖĞRETİM") || b.includes("ACIKOGRETIM") || b.includes("AÖF"))
      return false;
    if (b.includes("İKİNCİ") || b.includes("IKINCI")) return false;
    if (b.includes("AÇIK VE UZAKTAN") || b.includes("ACIK VE UZAKTAN")) return false;
    return true;
  }
  if (ogVal === "ikinci") return b.includes("İKİNCİ") || b.includes("IKINCI");
  if (ogVal === "acik")
    return (
      b.includes("AÇIKÖĞRETİM") ||
      b.includes("ACIKOGRETIM") ||
      b.includes("AÖF") ||
      b.includes("AÇIK VE UZAKTAN") ||
      b.includes("ACIK VE UZAKTAN")
    );
  if (ogVal === "uzaktan") return b.includes("UZAKTAN");
  return true;
}

function bursTuruFromEkBilgi(val: unknown): BursTuru | null {
  if (val == null || String(val).trim() === "") return null;
  const u = trUpper(String(val).trim());
  if (u === "BURSLU" || u.includes("TAM BURSLU")) return "Burslu";
  if (u.includes("%50") || u.includes("50 INDIRIM") || u.includes("YUZDE 50"))
    return "%50 Burslu";
  if (u.includes("%25") || u.includes("25 INDIRIM") || u.includes("YUZDE 25"))
    return "%25 Burslu";
  if (u === "ÜCRETLİ" || u === "UCRETLI" || u.includes("ÜCRETL") || u.includes("UCRETL"))
    return "Burssuz";
  return null;
}

function deriveBursTuru(row: YokAtlasProgram): BursTuru {
  const fromEk =
    bursTuruFromEkBilgi(row.Ek_Bilgi_1) || bursTuruFromEkBilgi(row.Ek_Bilgi_2);
  if (fromEk) return fromEk;
  return "Burssuz";
}

export function enrichAtlasProgram<T extends YokAtlasProgram>(
  row: T,
  index: number
): T & YokAtlasProgramEnriched {
  const universiteDisplay = formatUniversiteDisplayName(row.Universite);
  return {
    ...row,
    bursTuru: deriveBursTuru(row),
    universiteDisplay,
    bolumDili: deriveBolumDili(row),
    depremKontenjan: hasDepremKontenjan(row),
    _search: buildAtlasSearchText(row, universiteDisplay),
  };
}

export function enrichAtlasBursTuru<T extends YokAtlasProgram>(
  rows: T[]
): (T & YokAtlasProgramEnriched)[] {
  return rows.map((row, i) => enrichAtlasProgram(row, i));
}

export function matchesBursFilter(
  row: YokAtlasProgramEnriched,
  selectedBurslar: string[]
): boolean {
  if (!selectedBurslar.length) return true;
  return selectedBurslar.includes(String(row.bursTuru || ""));
}

export function bursDisplayLabel(turu: string): string {
  const t = String(turu || "");
  if (t === "Burslu") return "Burslu (Tam)";
  if (t === "%50 Burslu") return "%50 Burslu";
  if (t === "%25 Burslu") return "%25 Burslu";
  return "Ücretli";
}

const CITY_TO_REGION: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  const add = (arr: string[], reg: string) => {
    for (const c of arr) m[trUpper(c)] = reg;
  };
  add(
    [
      "İSTANBUL",
      "BURSA",
      "KOCAELİ",
      "TEKİRDAĞ",
      "EDİRNE",
      "KIRKLARELİ",
      "YALOVA",
      "SAKARYA",
      "BİLECİK",
      "BALIKESİR",
      "ÇANAKKALE",
      "DÜZCE",
    ],
    "Marmara"
  );
  add(["İZMİR", "AYDIN", "MANİSA", "MUĞLA", "DENİZLİ", "AFYONKARAHİSAR", "KÜTAHYA", "UŞAK"], "Ege");
  add(["ANTALYA", "MERSİN", "ADANA", "HATAY", "OSMANİYE", "KAHRAMANMARAŞ", "İSKENDERUN"], "Akdeniz");
  add(
    [
      "ANKARA",
      "KONYA",
      "KAYSERİ",
      "ESKİŞEHİR",
      "SİVAS",
      "AKSARAY",
      "KIRIKKALE",
      "KARAMAN",
      "KIRŞEHİR",
      "NEVŞEHİR",
      "NİĞDE",
      "YOZGAT",
      "ÇANKIRI",
      "ÇORUM",
    ],
    "İç Anadolu"
  );
  add(
    [
      "TRABZON",
      "SAMSUN",
      "ORDU",
      "GİRESUN",
      "RİZE",
      "ARTVİN",
      "GÜMÜŞHANE",
      "BAYBURT",
      "KASTAMONU",
      "SİNOP",
      "AMASYA",
      "TOKAT",
      "ZONGULDAK",
      "BARTIN",
      "KARABÜK",
      "BOLU",
    ],
    "Karadeniz"
  );
  add(
    [
      "ERZURUM",
      "VAN",
      "MALATYA",
      "ELAZIĞ",
      "ERZİNCAN",
      "AĞRI",
      "KARS",
      "IĞDIR",
      "ARDAHAN",
      "BİNGÖL",
      "TUNCELİ",
      "MUŞ",
      "BİTLİS",
      "HAKKARİ",
    ],
    "Doğu Anadolu"
  );
  add(
    [
      "GAZİANTEP",
      "ŞANLIURFA",
      "DİYARBAKIR",
      "MARDİN",
      "BATMAN",
      "SİİRT",
      "ŞIRNAK",
      "KİLİS",
      "ADIYAMAN",
    ],
    "Güneydoğu Anadolu"
  );
  return m;
})();

export function regionOfCity(city: string): string {
  if (!city) return "Diğer";
  return CITY_TO_REGION[trUpper(String(city).trim())] || "Diğer";
}
