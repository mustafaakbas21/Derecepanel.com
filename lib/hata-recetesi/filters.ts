import type { HataKaynagi, HataTipi, WrongQuestionRecord } from "@/lib/hata-recetesi/types";

export type WrongPoolFilters = {
  ogrenciCanonical?: string;
  dersName?: string;
  konuName?: string;
  kavramName?: string;
  hataTipi?: HataTipi | "";
  hataKaynagi?: { deneme?: boolean; soru_bankasi?: boolean };
  requireImage?: boolean;
};

export function normOgrenci(q: WrongQuestionRecord): string {
  return String(q.ogrenciAdi || q.ogrenci || "").trim();
}

export function normHataTipi(q: WrongQuestionRecord): HataTipi {
  const v = String(q.hataTipi || (q as { hata_tipi?: string }).hata_tipi || "yanlis")
    .toLowerCase()
    .trim();
  if (v === "bos" || v === "bırakilmis" || v === "bos_birakilmis") return "bos";
  return "yanlis";
}

export function normHataKaynagi(q: WrongQuestionRecord): HataKaynagi | "" {
  const v = String(q.hataKaynagi || "")
    .toLowerCase()
    .trim();
  if (v === "soru_bankasi" || v === "soru bankasi" || v === "sorubankasi") return "soru_bankasi";
  if (v === "deneme") return "deneme";
  return "";
}

export function questionImageUrl(q: WrongQuestionRecord): string {
  const raw = q as WrongQuestionRecord & { dataURL?: string; image?: string };
  return raw.dataUrl || raw.dataURL || raw.image || "";
}

export function questionHasCloudImage(q: WrongQuestionRecord): boolean {
  return !!(q.imageFileId && q.imageBucketId);
}

export function filterWrongPool(
  pool: WrongQuestionRecord[],
  params: WrongPoolFilters
): WrongQuestionRecord[] {
  const hk = params.hataKaynagi ?? { deneme: true, soru_bankasi: true };
  const hkDeneme = !!hk.deneme;
  const hkSb = !!hk.soru_bankasi;
  const shouldFilterHk = (hkDeneme || hkSb) && !(hkDeneme && hkSb);

  return pool.filter((q) => {
    if (params.requireImage && !questionImageUrl(q) && !questionHasCloudImage(q)) return false;
    if (params.dersName && q.ders !== params.dersName) return false;
    if (params.konuName && q.konu !== params.konuName) return false;
    if (params.kavramName && q.kavram !== params.kavramName) return false;
    if (params.hataTipi && normHataTipi(q) !== params.hataTipi) return false;
    if (shouldFilterHk) {
      const src = normHataKaynagi(q);
      if (hkDeneme && src !== "deneme") return false;
      if (hkSb && src !== "soru_bankasi") return false;
    }
    if (params.ogrenciCanonical && normOgrenci(q) !== params.ogrenciCanonical) return false;
    return true;
  });
}
