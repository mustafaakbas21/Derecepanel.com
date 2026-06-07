import {
  atlasRowToAlternative,
  enrichParlakAlternatives,
  matchAtlasTabanForBolum,
  pickDiverseParlakPrograms,
  programMatchesHedef,
  sortProgramsByHedef,
} from "@/lib/onyx/career-atlas-match";
import type {
  CareerAlternative,
  CareerAtlasRow,
  OnyxCareerCounseling,
  OgrenciNetSnapshot,
} from "@/lib/onyx/career-types";
import type { ResolvedStudentHedef } from "@/lib/onyx/resolve-student-hedef";

export type {
  CareerAlternative,
  CareerAtlasRow,
  OnyxCareerCounseling,
} from "@/lib/onyx/career-types";

function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function coerceAlternatives(raw: unknown): CareerAlternative[] {
  if (!Array.isArray(raw)) return [];
  const out: CareerAlternative[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const bolum = String(o.bolum ?? "").trim();
    const nedenUygun = String(o.nedenUygun ?? o.neden ?? "").trim();
    const tabanRaw = String(o.tabanPuani ?? o.taban ?? "").trim();
    const tabanPuani =
      tabanRaw && !/veri bulunamad/i.test(tabanRaw) ? tabanRaw : undefined;
    if (!bolum || !nedenUygun) continue;
    const isBulma = o.isBulma as CareerAlternative["isBulma"] | undefined;
    const sektorTrendi = o.sektorTrendi as CareerAlternative["sektorTrendi"] | undefined;
    out.push({ bolum, nedenUygun, tabanPuani, isBulma, sektorTrendi });
  }
  return out;
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
        o.baslik ??
        ""
    ).trim();
  }
  const s = String(raw ?? "").trim();
  return s === "[object Object]" ? "" : s;
}

/** Model sapması / boş alternatif / hatalı net ifadesini düzeltir */
export function alignCareerWithGroundTruth(
  career: OnyxCareerCounseling,
  input: {
    hedef: ResolvedStudentHedef | null;
    atlasPrograms: CareerAtlasRow[];
    parlakPrograms?: CareerAtlasRow[];
    nets: OgrenciNetSnapshot;
  }
): OnyxCareerCounseling {
  const avantajVeDezavantajlar = career.meslekAnalizi.avantajVeDezavantajlar
    .map(coerceCareerText)
    .filter(Boolean);

  let mevcutDurum = career.netAnaliziVeAlternatifler.mevcutDurum;
  if (
    input.nets.sonTyTNet == null &&
    /TYT neti\s*0|son gerçek TYT neti 0/i.test(mevcutDurum)
  ) {
    mevcutDurum = mevcutDurum
      .replace(/son gerçek TYT neti 0/gi, "TYT neti kayıtta yok")
      .replace(/TYT neti 0/gi, "TYT neti kayıtta yok");
  }

  let hedefeYakinAlternatifler =
    career.netAnaliziVeAlternatifler.hedefeYakinAlternatifler;
  let farkliAmaGelecegiParlakBölümler =
    career.netAnaliziVeAlternatifler.farkliAmaGelecegiParlakBölümler;

  if (hedefeYakinAlternatifler.length === 0 && input.atlasPrograms.length > 0) {
    const sorted = sortProgramsByHedef(input.atlasPrograms, input.hedef);
    const hedefMatch = sorted.filter((p) => programMatchesHedef(p, input.hedef));
    const primary = hedefMatch.length > 0 ? hedefMatch : sorted;
    hedefeYakinAlternatifler = primary.slice(0, 4).map(atlasRowToAlternative);
  }

  const parlakPool = [
    ...(input.parlakPrograms ?? []),
    ...input.atlasPrograms,
  ];
  const diverseParlak = pickDiverseParlakPrograms(parlakPool, {
    hedef: input.hedef,
    excludeAlternatives: hedefeYakinAlternatifler,
    max: 3,
  });
  if (diverseParlak.length > 0) {
    farkliAmaGelecegiParlakBölümler = diverseParlak.map(atlasRowToAlternative);
  } else {
    farkliAmaGelecegiParlakBölümler = enrichParlakAlternatives(
      farkliAmaGelecegiParlakBölümler
    );
  }

  let gelecekVizyonu = career.meslekAnalizi.gelecekVizyonu;
  if (input.hedef?.label) {
    const vizyonLower = gelecekVizyonu.toLocaleLowerCase("tr");
    const bolumLower = (input.hedef.bolum ?? "").toLocaleLowerCase("tr");
    const labelLower = input.hedef.label.toLocaleLowerCase("tr");
    const mentionsHedef =
      vizyonLower.includes(labelLower) ||
      (bolumLower.length >= 4 && vizyonLower.includes(bolumLower));
    if (!mentionsHedef) {
      gelecekVizyonu = `Profildeki hedef (${input.hedef.label}) için: ${gelecekVizyonu}`;
    }
  }

  return {
    meslekAnalizi: {
      gelecekVizyonu,
      avantajVeDezavantajlar:
        avantajVeDezavantajlar.length > 0
          ? avantajVeDezavantajlar
          : career.meslekAnalizi.avantajVeDezavantajlar,
    },
    netAnaliziVeAlternatifler: {
      mevcutDurum,
      hedefeYakinAlternatifler,
      farkliAmaGelecegiParlakBölümler,
    },
    onyxTavsiyesi: career.onyxTavsiyesi,
  };
}

export function enrichCareerWithAtlasPrograms(
  career: OnyxCareerCounseling,
  programlar: CareerAtlasRow[]
): OnyxCareerCounseling {
  if (programlar.length === 0) return career;

  const enrichList = (items: CareerAlternative[]): CareerAlternative[] =>
    items.map((alt) => {
      if (alt.tabanPuani?.trim()) return alt;
      const matched = matchAtlasTabanForBolum(alt.bolum, programlar);
      return matched ? { ...alt, tabanPuani: matched } : alt;
    });

  return {
    ...career,
    netAnaliziVeAlternatifler: {
      ...career.netAnaliziVeAlternatifler,
      hedefeYakinAlternatifler: enrichList(
        career.netAnaliziVeAlternatifler.hedefeYakinAlternatifler
      ),
      farkliAmaGelecegiParlakBölümler: enrichList(
        career.netAnaliziVeAlternatifler.farkliAmaGelecegiParlakBölümler
      ),
    },
  };
}

export function parseCareerCounselingFromText(
  text: string
): OnyxCareerCounseling | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const fenced =
    trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] ??
    trimmed.match(/\{[\s\S]*\}/)?.[0];
  const candidate = fenced?.trim() ?? trimmed;

  let obj: Record<string, unknown> | null = null;
  const direct = tryParseJson(candidate);
  if (direct && typeof direct === "object" && !Array.isArray(direct)) {
    obj = direct as Record<string, unknown>;
  } else {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      const inner = tryParseJson(trimmed.slice(start, end + 1));
      if (inner && typeof inner === "object" && !Array.isArray(inner)) {
        obj = inner as Record<string, unknown>;
      }
    }
  }

  if (!obj) return null;

  const ma = (obj.meslekAnalizi ?? obj.meslek_analizi) as
    | Record<string, unknown>
    | undefined;
  const na = (obj.netAnaliziVeAlternatifler ??
    obj.net_analizi) as Record<string, unknown> | undefined;

  if (!ma || !na) return null;

  const gelecekVizyonu = String(ma.gelecekVizyonu ?? ma.gelecek ?? "").trim();
  const avantajRaw = ma.avantajVeDezavantajlar ?? ma.avantajlar;
  const avantajVeDezavantajlar = Array.isArray(avantajRaw)
    ? avantajRaw.map((s) => String(s).trim()).filter(Boolean)
    : [];

  const mevcutDurum = String(na.mevcutDurum ?? "").trim();
  const onyxTavsiyesi = String(
    obj.onyxTavsiyesi ?? obj.onyx_mesaji ?? ""
  ).trim();

  if (
    !gelecekVizyonu ||
    avantajVeDezavantajlar.length === 0 ||
    !mevcutDurum ||
    !onyxTavsiyesi
  ) {
    return null;
  }

  return {
    meslekAnalizi: { gelecekVizyonu, avantajVeDezavantajlar },
    netAnaliziVeAlternatifler: {
      mevcutDurum,
      hedefeYakinAlternatifler: coerceAlternatives(
        na.hedefeYakinAlternatifler ?? na.alternatifler
      ),
      farkliAmaGelecegiParlakBölümler: coerceAlternatives(
        na.farkliAmaGelecegiParlakBölümler ?? na.parlak_bolumler
      ),
    },
    onyxTavsiyesi,
  };
}

export function formatCareerCounselingFallbackMarkdown(
  c: OnyxCareerCounseling
): string {
  const hedef = c.netAnaliziVeAlternatifler.hedefeYakinAlternatifler[0]?.bolum;
  return `<!-- onyx-career -->
## Kariyer & Tercih Analizi${hedef ? ` — ${hedef}` : ""}`;
}

export function isCareerIntentText(text: string): boolean {
  const t = text.toLocaleLowerCase("tr");
  const keys = [
    "kariyer",
    "tercih",
    "bölüm",
    "bolum",
    "meslek",
    "mühendis",
    "muhendis",
    "taban puan",
    "başarı sırası",
    "basari sirasi",
    "üniversite",
    "universite",
    "önlisans",
    "onlisans",
    "lisans",
    "gelecek",
    "iş imkan",
    "is imkan",
  ];
  return keys.some((k) => t.includes(k));
}
