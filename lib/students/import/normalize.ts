/** Başlık anahtarı: trim, tr küçük harf, boşluk ve / kaldır, Türkçe harfleri ASCII'ye yaklaştır */
export function normKey(s: string): string {
  return s
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/\s+/g, "")
    .replace(/\//g, "")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

/** Ham satır başlıklarını canonical alan adlarına çevirir */
export function normalizeHeaderRow(
  headers: string[]
): { canonical: string; index: number }[] {
  return headers
    .map((h, index) => ({ canonical: mapHeaderToField(normKey(h)), index }))
    .filter((x) => x.canonical.length > 0);
}

export function mapHeaderToField(normalized: string): string {
  const map: Record<string, string> = {
    ogrencino: "studentNo",
    ad: "firstName",
    soyad: "lastName",
    tckimlik: "tc",
    tc: "tc",
    cinsiyet: "gender",
    dogumtarihi: "birthDate",
    sinifsube: "classRoom",
    sinif: "classRoom",
    sube: "branch",
    alan: "alan",
    ogrencitelefon: "phone",
    telefon: "phone",
    veliadsoyad: "parentName",
    velitelefon: "parentPhone",
    veliyakinlik: "parentRelation",
    kayitpaketi: "package",
    hedefuniversitebolum: "target",
    hedef: "target",
    veli: "parentName",
    velitelefonu: "parentPhone",
    name: "name",
    sinifbranch: "sinif",
    velitelefon2: "parentPhone",
  };
  return map[normalized] ?? "";
}
