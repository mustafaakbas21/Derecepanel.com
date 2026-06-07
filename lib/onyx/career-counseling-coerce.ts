import type { CareerAtlasRow, OnyxCareerCounseling } from "@/lib/onyx/career-types";
import { extractOgrenciNetleriFromContext } from "@/lib/onyx/career-rag-server";
import {
  atlasRowToAlternative,
  pickDiverseParlakPrograms,
  programMatchesHedef,
  sortProgramsByHedef,
} from "@/lib/onyx/career-atlas-match";
import { resolveStudentHedef } from "@/lib/onyx/resolve-student-hedef";

const PLACEHOLDER_PATTERNS: RegExp[] = [
  /bölümün önü açık mı/i,
  /sektördeki yenilikler \(ai/i,
  /^avantaj\.{2,}$/i,
  /^dezavantaj\.{2,}$/i,
  /veri yoksa açıkça belirt/i,
  /alternatif bölüm\s*\d/i,
  /^neden:\s*uygun$/i,
  /^taban:\s*taban puanı$/i,
  /^üniversite\s*—\s*bölüm$/i,
  /^\.\.\.$/,
  /^\[object Object\]$/i,
];

function programLabel(p: CareerAtlasRow): string {
  return `${p.universite} — ${p.bolum}`;
}

function extractHedefFromStudentData(
  studentData: unknown
): { universite?: string; bolum?: string; label: string } | null {
  const resolved = resolveStudentHedef(studentData);
  if (!resolved) return null;
  return {
    universite: resolved.universite,
    bolum: resolved.bolum,
    label: resolved.label,
  };
}

function coerceCareerText(raw: unknown): string {
  if (typeof raw === "string") return raw.trim();
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    return String(
      o.text ??
        o.madde ??
        o.avantaj ??
        o.dezavantaj ??
        o.aciklama ??
        o.label ??
        ""
    ).trim();
  }
  const s = String(raw ?? "").trim();
  return s === "[object Object]" ? "" : s;
}

function coerceAlternative(raw: unknown): {
  bolum: string;
  nedenUygun: string;
  tabanPuani?: string;
} | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const uni = String(o.universite ?? "").trim();
  const bolOnly = String(o.bolum ?? o.program ?? "").trim();
  const bolum =
    (uni && bolOnly ? `${uni} — ${bolOnly}` : bolOnly || uni) ||
    String(o.universite_bolum ?? "").trim();
  const nedenUygun = String(
    o.nedenUygun ?? o.neden ?? o.neden_uygun ?? o.aciklama ?? ""
  ).trim();
  const tabanRaw = o.tabanPuani ?? o.taban ?? o.taban_puani;
  const tabanPuani =
    tabanRaw != null && String(tabanRaw).trim()
      ? String(tabanRaw).trim()
      : undefined;
  if (!bolum) return null;
  return {
    bolum,
    nedenUygun: nedenUygun || "Atlas verisine göre uygun alternatif.",
    tabanPuani,
  };
}

/** Groq çıktısını Zod şemasına uygun hale getirir */
export function preprocessCareerCounseling(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const obj = raw as Record<string, unknown>;

  if (obj.type === "career" && obj.data && typeof obj.data === "object") {
    return preprocessCareerCounseling({ ...obj.data });
  }

  const ma = (obj.meslekAnalizi ?? obj.meslek_analizi) as
    | Record<string, unknown>
    | undefined;
  const na = (obj.netAnaliziVeAlternatifler ??
    obj.net_analizi_ve_alternatifler ??
    obj.net_analizi) as Record<string, unknown> | undefined;

  if (!ma || !na) {
    if (
      obj.gelecekVizyonu != null ||
      obj.mevcutDurum != null ||
      obj.onyxTavsiyesi != null ||
      obj.alternatifler != null
    ) {
      return preprocessCareerCounseling({
        meslekAnalizi: {
          gelecekVizyonu: obj.gelecekVizyonu ?? obj.vizyon,
          avantajVeDezavantajlar:
            obj.avantajVeDezavantajlar ?? obj.avantajlar ?? [],
        },
        netAnaliziVeAlternatifler: {
          mevcutDurum: obj.mevcutDurum,
          hedefeYakinAlternatifler:
            obj.hedefeYakinAlternatifler ?? obj.alternatifler ?? [],
          farkliAmaGelecegiParlakBölümler:
            obj.farkliAmaGelecegiParlakBölümler ?? obj.parlakBolumler ?? [],
        },
        onyxTavsiyesi: obj.onyxTavsiyesi ?? obj.tavsiye,
      });
    }
    return raw;
  }

  const avantajRaw = ma.avantajVeDezavantajlar ?? ma.avantajlar ?? [];
  let avantajVeDezavantajlar = Array.isArray(avantajRaw)
    ? avantajRaw.map(coerceCareerText).filter(Boolean)
    : [];
  if (avantajVeDezavantajlar.length === 0) {
    avantajVeDezavantajlar = ["Hedef bölüm için atlas verisi değerlendirildi."];
  }

  const hedefRaw =
    na.hedefeYakinAlternatifler ??
    na.alternatifler ??
    na.hedefe_yakin_alternatifler ??
    [];
  const parlakRaw =
    na.farkliAmaGelecegiParlakBölümler ??
    na.farkliAmaGelecegiParlakBolumler ??
    na.parlakBolumler ??
    na.parlak_bolumler ??
    [];

  const hedefeYakinAlternatifler = (Array.isArray(hedefRaw) ? hedefRaw : [])
    .map(coerceAlternative)
    .filter((x): x is NonNullable<typeof x> => Boolean(x));
  const farkliAmaGelecegiParlakBölümler = (
    Array.isArray(parlakRaw) ? parlakRaw : []
  )
    .map(coerceAlternative)
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  const gelecekVizyonu = String(ma.gelecekVizyonu ?? ma.gelecek ?? "").trim();
  const mevcutDurum = String(na.mevcutDurum ?? na.durum ?? "").trim();
  const onyxTavsiyesi = String(
    obj.onyxTavsiyesi ?? obj.onyx_mesaji ?? obj.tavsiye ?? ""
  ).trim();

  return {
    meslekAnalizi: {
      gelecekVizyonu:
        gelecekVizyonu || "Hedef bölümün sektör trendi atlas ve profil verisiyle değerlendirilmelidir.",
      avantajVeDezavantajlar,
    },
    netAnaliziVeAlternatifler: {
      mevcutDurum:
        mevcutDurum ||
        "Net ve taban karşılaştırması için güncel deneme ve atlas verisi gerekir.",
      hedefeYakinAlternatifler,
      farkliAmaGelecegiParlakBölümler,
    },
    onyxTavsiyesi:
      onyxTavsiyesi ||
      "Hedef programları net trendinizle birlikte okuyun; eksik derslere haftalık planda ağırlık verin.",
  };
}

function collectCareerStrings(c: OnyxCareerCounseling): string[] {
  return [
    c.meslekAnalizi.gelecekVizyonu,
    c.netAnaliziVeAlternatifler.mevcutDurum,
    c.onyxTavsiyesi,
    ...c.meslekAnalizi.avantajVeDezavantajlar,
    ...c.netAnaliziVeAlternatifler.hedefeYakinAlternatifler.flatMap((a) => [
      a.bolum,
      a.nedenUygun,
      a.tabanPuani ?? "",
    ]),
    ...c.netAnaliziVeAlternatifler.farkliAmaGelecegiParlakBölümler.flatMap((a) => [
      a.bolum,
      a.nedenUygun,
      a.tabanPuani ?? "",
    ]),
  ].map((s) => s.trim());
}

/** Model şema talimatlarını içerik olarak kopyaladıysa true */
export function isCareerPlaceholderOutput(c: OnyxCareerCounseling): boolean {
  const texts = collectCareerStrings(c);
  if (texts.some((t) => PLACEHOLDER_PATTERNS.some((p) => p.test(t)))) {
    return true;
  }
  if (c.meslekAnalizi.gelecekVizyonu.length < 40) return true;
  if (c.netAnaliziVeAlternatifler.mevcutDurum.length < 25) return true;
  return false;
}

/** Atlas + net verisinden güvenilir yedek rapor */
export function buildCareerFallbackFromRag(input: {
  studentData: unknown;
  atlasPrograms: CareerAtlasRow[];
}): OnyxCareerCounseling {
  const nets = extractOgrenciNetleriFromContext(input.studentData);
  const hedef = extractHedefFromStudentData(input.studentData);
  const programs = input.atlasPrograms;
  const sorted = sortProgramsByHedef(programs, resolveStudentHedef(input.studentData));

  const hedefAd = hedef?.label?.trim() || sorted[0]?.bolum?.trim() || "kayıtlı hedef bölüm";

  let mevcutDurum: string;
  if (nets.durum === "mevcut") {
    const parcalar: string[] = [];
    if (nets.sonTyTNet != null) parcalar.push(`Son TYT neti ${nets.sonTyTNet}`);
    if (nets.sonAytNet != null) parcalar.push(`son AYT neti ${nets.sonAytNet}`);
    const netOzet = parcalar.length > 0 ? parcalar.join(", ") : nets.ozetMetin ?? "Net kaydı mevcut";
    const tabanRef = programs[0]?.tabanPuani
      ? ` Atlas referansı (${programLabel(programs[0])}): taban ${programs[0].tabanPuani}.`
      : "";
    mevcutDurum = `${netOzet}.${tabanRef} Kesin mesafe için Net Sihirbazı ile branş kırılımı önerilir.`;
  } else {
    mevcutDurum =
      "Veri bulunamadı — öğrencinin güncel deneme neti kayıtlı değil. Deneme sonucu yüklendikten sonra taban kıyaslaması güvenilir olur.";
  }

  const toAlt = (p: CareerAtlasRow) => atlasRowToAlternative(p);

  const hedefMatch = sorted.filter((p) =>
    programMatchesHedef(p, resolveStudentHedef(input.studentData))
  );
  const primary = hedefMatch.length > 0 ? hedefMatch : sorted;
  const hedefeYakin = primary.slice(0, 3).map(toAlt);
  const parlak = pickDiverseParlakPrograms(
    [...programs, ...sorted],
    { hedef: resolveStudentHedef(input.studentData), excludePrograms: primary, max: 3 }
  ).map(toAlt);

  return {
    meslekAnalizi: {
      gelecekVizyonu: `${hedefAd} için mezuniyet sonrası iş piyasası dijitalleşme ve yapay zeka ile şekilleniyor. Tercih stratejisinde taban puan trendi, kontenjan ve puan türü birlikte okunmalı; aşağıdaki atlas satırları güncel YÖK verisidir.`,
      avantajVeDezavantajlar: [
        programs.length > 0
          ? `Avantaj: ${programs.length} gerçek atlas programı hedef ve soru metnine göre listelendi.`
          : "Avantaj: Öğrenci hedefi profilde tanımlı — atlas araması için bölüm adını netleştirin.",
        nets.durum === "mevcut"
          ? "Dezavantaj: Net–taban mesafesi branş bazında ayrı hesaplanmalı; toplam net tek başına yeterli değil."
          : "Dezavantaj: Deneme neti olmadan sayısal mesafe hesaplanamaz.",
      ],
    },
    netAnaliziVeAlternatifler: {
      mevcutDurum,
      hedefeYakinAlternatifler: hedefeYakin,
      farkliAmaGelecegiParlakBölümler: parlak,
    },
    onyxTavsiyesi:
      programs.length > 0
        ? "Önce taban listesindeki programları net trendinizle yan yana okuyun; ardından haftalık planda en zayıf derse odaklanın."
        : "Profilde hedef bölümü ve en az bir deneme sonucunu güncelleyin; atlas eşleşmesi olmadan tercih analizi üretilemez.",
  };
}
