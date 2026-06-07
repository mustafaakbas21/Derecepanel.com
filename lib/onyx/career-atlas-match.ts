import type { CareerAlternative, CareerAtlasRow } from "@/lib/onyx/career-types";
import { buildParlakNedenUygun } from "@/lib/onyx/career-sector-insights";
import type { ResolvedStudentHedef } from "@/lib/onyx/resolve-student-hedef";

export function normalizeBolumKey(bolum: string): string {
  return normalizeSearchText(bolum)
    .replace(/\b(onlisans|lisans|myo|programi)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSearchText(text: string): string {
  return text
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Atlas satırından bölüm adına göre taban puan eşleştir (istemci + sunucu güvenli) */
export function matchAtlasTabanForBolum(
  bolum: string,
  programlar: CareerAtlasRow[]
): string | undefined {
  const needle = normalizeSearchText(bolum);
  if (!needle) return undefined;
  const hit = programlar.find((p) => {
    const hay = normalizeSearchText(`${p.bolum} ${p.universite}`);
    return hay.includes(needle) || needle.includes(normalizeSearchText(p.bolum));
  });
  const taban = hit?.tabanPuani?.trim();
  return taban || undefined;
}

export function programMatchesHedef(
  program: CareerAtlasRow,
  hedef: ResolvedStudentHedef | null
): boolean {
  if (!hedef) return false;
  const hay = normalizeSearchText(`${program.bolum} ${program.universite}`);
  const bolum = normalizeSearchText(hedef.bolum ?? "");
  const uni = normalizeSearchText(hedef.universite ?? "");
  if (bolum.length >= 4 && hay.includes(bolum)) return true;
  if (uni.length >= 3 && bolum.length >= 4) {
    const combo = `${uni} ${bolum}`.trim();
    if (hay.includes(combo)) return true;
  }
  if (hedef.label) {
    const label = normalizeSearchText(hedef.label);
    if (label.length >= 6 && hay.includes(label)) return true;
  }
  return false;
}

export function sortProgramsByHedef(
  programlar: CareerAtlasRow[],
  hedef: ResolvedStudentHedef | null
): CareerAtlasRow[] {
  if (!hedef) return [...programlar];
  return [...programlar].sort((a, b) => {
    const aMatch = programMatchesHedef(a, hedef) ? 1 : 0;
    const bMatch = programMatchesHedef(b, hedef) ? 1 : 0;
    return bMatch - aMatch;
  });
}

export function atlasRowToAlternative(p: CareerAtlasRow): CareerAlternative {
  const bolum = `${p.universite} — ${p.bolum}`;
  const enriched = buildParlakNedenUygun(p.bolum, p.tabanPuani, p.puanTipi);
  return {
    bolum,
    nedenUygun: enriched.nedenUygun,
    tabanPuani: p.tabanPuani || undefined,
    isBulma: enriched.isBulma,
    sektorTrendi: enriched.sektorTrendi,
  };
}

function programBolumMatchesKey(program: CareerAtlasRow, key: string): boolean {
  if (!key) return false;
  const hay = normalizeBolumKey(program.bolum);
  return hay === key || hay.includes(key) || key.includes(hay);
}

/** Aynı bölüm adını tekrar etmeden, hedeften farklı alanları seç */
export function pickDiverseParlakPrograms(
  programlar: CareerAtlasRow[],
  input: {
    hedef: ResolvedStudentHedef | null;
    excludePrograms?: CareerAtlasRow[];
    excludeAlternatives?: CareerAlternative[];
    max?: number;
  }
): CareerAtlasRow[] {
  const max = input.max ?? 3;
  const hedefKey = normalizeBolumKey(input.hedef?.bolum ?? "");
  const seenBolum = new Set<string>();
  const excludeKeys = new Set<string>();

  for (const alt of input.excludeAlternatives ?? []) {
    const parts = alt.bolum.split("—");
    const bolumPart = (parts[parts.length - 1] ?? alt.bolum).trim();
    excludeKeys.add(normalizeBolumKey(bolumPart));
  }
  for (const p of input.excludePrograms ?? []) {
    excludeKeys.add(normalizeBolumKey(p.bolum));
  }
  if (hedefKey) excludeKeys.add(hedefKey);

  const out: CareerAtlasRow[] = [];
  for (const p of programlar) {
    const key = normalizeBolumKey(p.bolum);
    if (!key || key.length < 4) continue;
    if (excludeKeys.has(key)) continue;
    if (hedefKey && programBolumMatchesKey(p, hedefKey)) continue;
    if (seenBolum.has(key)) continue;
    seenBolum.add(key);
    out.push(p);
    if (out.length >= max) break;
  }
  return out;
}

export function enrichParlakAlternatives(
  items: CareerAlternative[]
): CareerAlternative[] {
  return items.map((alt) => {
    if (alt.isBulma && alt.sektorTrendi && !/^YÖK Atlas taban/i.test(alt.nedenUygun)) {
      return alt;
    }
    const bolumPart = alt.bolum.split("—").pop()?.trim() ?? alt.bolum;
    const enriched = buildParlakNedenUygun(bolumPart, alt.tabanPuani);
    const genericTabanOnly = /^YÖK Atlas taban/i.test(alt.nedenUygun);
    return {
      ...alt,
      nedenUygun: genericTabanOnly ? enriched.nedenUygun : alt.nedenUygun,
      isBulma: alt.isBulma ?? enriched.isBulma,
      sektorTrendi: alt.sektorTrendi ?? enriched.sektorTrendi,
    };
  });
}
