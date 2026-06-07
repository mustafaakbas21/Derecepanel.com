import type { MentalSkillData } from "@/lib/onyx/skill-types";

function str(v: unknown): string {
  return String(v ?? "").trim();
}

function strArr(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => str(x)).filter(Boolean);
}

function pickBdt(raw: Record<string, unknown>): MentalSkillData["bdtCalismasi"] {
  const nested =
    raw.bdtCalismasi && typeof raw.bdtCalismasi === "object"
      ? (raw.bdtCalismasi as Record<string, unknown>)
      : raw;

  const carpitma = str(
    nested.carpitma ?? nested.carpitmaAdi ?? raw.tespitEdilenDuygu
  );
  const dusunceKaydi = str(
    nested.dusunceKaydi ?? nested.otomatikDusunce ?? nested.dusunce
  );
  const alternatifDusunce = str(
    nested.alternatifDusunce ?? nested.dengeliDusunce ?? nested.alternatif
  );

  return {
    carpitma: carpitma || "Felaketleştirme / aşırı genelleme",
    dusunceKaydi:
      dusunceKaydi || "Her şey kötü gidiyor, artık toparlayamam.",
    alternatifDusunce:
      alternatifDusunce ||
      "Bugün zor bir gün; bu duygu geçici. Küçük bir adım yeterli.",
  };
}

function pickNefes(raw: Record<string, unknown>): MentalSkillData["nefesProtokolu"] {
  const nested =
    raw.nefesProtokolu && typeof raw.nefesProtokolu === "object"
      ? (raw.nefesProtokolu as Record<string, unknown>)
      : null;

  const baslik = str(nested?.baslik ?? raw.nefesBaslik) || "4-7-8 Sakinleştirme Nefesi";
  let adimlar = strArr(nested?.adimlar ?? raw.nefesAdimlari);

  if (adimlar.length === 0) {
    adimlar = [
      "Omuzlarını gevşet; ayak tabanlarını yere bastır.",
      "4 saniye burnundan nefes al.",
      "7 saniye nefesini tut.",
      "8 saniye ağzından yavaşça ver.",
      "Bunu 3 tur tekrarla; gözlerini kapatmana gerek yok.",
    ];
  }

  return { baslik, adimlar };
}

/** Eski / eksik AI alanlarını zengin MentalSkillData'ya tamamlar */
export function coerceMentalSkillData(raw: unknown): MentalSkillData | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;

  const inner =
    data.data && typeof data.data === "object"
      ? (data.data as Record<string, unknown>)
      : data;

  const tespitEdilenDuygu = str(
    inner.tespitEdilenDuygu ??
      inner.duyguDurumu ??
      inner.biliselCarpitma ??
      inner.carpitma
  );

  let terapotikTelkin = str(
    inner.terapotikTelkin ??
      inner.telkinMesaji ??
      inner.psikologNotu ??
      inner.mesaj ??
      inner.ozet
  );

  const dostAcilisi = str(
    inner.dostAcilisi ?? inner.dostMesaji ?? inner.empatiAcilisi
  );
  const duyguHaritasi = str(inner.duyguHaritasi ?? inner.duyguAnalizi);
  const dostKapanisi = str(inner.dostKapanisi ?? inner.kapanis ?? inner.onyxMesaji);

  if (!terapotikTelkin && dostAcilisi) {
    terapotikTelkin = dostAcilisi;
  }

  let acilAksiyonRecetesi = strArr(
    inner.acilAksiyonRecetesi ?? inner.aksiyonAdimlari ?? inner.aksiyonlar
  );
  const tek = str(inner.aksiyonAdimi);
  if (acilAksiyonRecetesi.length === 0 && tek) {
    acilAksiyonRecetesi = [tek];
  }

  const kanitlar = strArr(inner.kanitlar);

  if (
    !tespitEdilenDuygu &&
    !terapotikTelkin &&
    !dostAcilisi &&
    acilAksiyonRecetesi.length === 0
  ) {
    return null;
  }

  return {
    dostAcilisi:
      dostAcilisi ||
      "Buradasın ve bunu paylaşman çok değerli — yalnız değilsin.",
    duyguHaritasi:
      duyguHaritasi ||
      "YKS sürecinde motivasyon dalgalanması beklenen bir yorgunluk belirtisidir; zayıflık değil.",
    tespitEdilenDuygu:
      tespitEdilenDuygu || "Motivasyon düşüşü / duygusal tükenme",
    bdtCalismasi: pickBdt(inner),
    terapotikTelkin:
      terapotikTelkin ||
      "Duygun geçerli. Zihnin şu an felaket senaryolarına kayıyor olabilir; birlikte daha gerçekçi bir çerçeveye dönelim.",
    nefesProtokolu: pickNefes(inner),
    acilAksiyonRecetesi:
      acilAksiyonRecetesi.length > 0
        ? acilAksiyonRecetesi
        : [
            "Masadan kalk; 2 dakika odanda yavaş yürü.",
            "Bugün çalışmayı planladığından 1 saat erken bitir.",
            "Telefonu 15 dk uçak moduna al; sadece nefes protokolünü uygula.",
          ],
    kanitlar,
    dostKapanisi:
      dostKapanisi ||
      "Bugün kendine nazik ol; yarın küçük bir adımla devam ederiz.",
  };
}

export function preprocessMentalSkillEnvelope(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const root = raw as Record<string, unknown>;

  let data: Record<string, unknown>;
  if (root.data && typeof root.data === "object" && !Array.isArray(root.data)) {
    data = { ...(root.data as Record<string, unknown>) };
  } else if (root.tespitEdilenDuygu != null || root.terapotikTelkin != null) {
    data = { ...root };
  } else {
    return raw;
  }

  const coerced = coerceMentalSkillData(data);
  if (!coerced) return raw;

  return {
    type: "mental",
    data: coerced,
  };
}
