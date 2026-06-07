import "server-only";

import type {
  CareerAtlasRow,
  CareerGroundTruth,
  OgrenciNetSnapshot,
} from "@/lib/onyx/career-types";
import {
  resolveStudentHedef,
  type ResolvedStudentHedef,
} from "@/lib/onyx/resolve-student-hedef";
import { getRelatedDepartmentSearchTerms } from "@/lib/onyx/career-sector-insights";
import { pickDiverseParlakPrograms } from "@/lib/onyx/career-atlas-match";
import {
  buildDenemeNetPromptBlock,
  type LatestDenemeNetsResult,
} from "@/lib/onyx/fetch-latest-deneme-nets-server";
import {
  loadAtlasPrograms,
  formatUniversityLabel,
} from "@/lib/universities/atlas-server";
import type { YokAtlasProgram } from "@/lib/universities/types";

export type {
  CareerAtlasRow,
  CareerGroundTruth,
  OgrenciNetSnapshot,
} from "@/lib/onyx/career-types";

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

function scoreProgram(p: YokAtlasProgram, terms: string[]): number {
  const hay = normalizeSearchText(
    `${p.Bolum} ${p.Universite} ${p.Fakulte_YO} ${p.Puan_Tipi}`
  );
  let score = 0;
  for (const t of terms) {
    if (t.length < 3) continue;
    if (hay.includes(t)) score += t.length >= 6 ? 4 : 2;
  }
  return score;
}

function mapRow(level: "lisans" | "onlisans", p: YokAtlasProgram): CareerAtlasRow {
  return {
    level,
    programKodu: (p.Program_Kodu ?? "").trim(),
    universite: formatUniversityLabel(p.Universite, p.Sehir),
    bolum: (p.Bolum ?? "").trim(),
    puanTipi: (p.Puan_Tipi ?? "").trim(),
    tabanPuani: (p.Taban_Puani_Guncel || p.Taban_2025 || "").trim(),
    basariSirasi: (p.Basari_Sirasi_Guncel || p.Basari_2025 || "").trim(),
    kontenjan: (p.Kontenjan_2025_Genel || "").trim(),
  };
}

async function searchPrograms(
  query: string,
  limit = 18
): Promise<CareerAtlasRow[]> {
  const terms = normalizeSearchText(query)
    .split(" ")
    .filter((w) => w.length >= 3);

  if (terms.length === 0) return [];

  const [lisans, onlisans] = await Promise.all([
    loadAtlasPrograms("lisans"),
    loadAtlasPrograms("onlisans"),
  ]);

  const scored: Array<{ score: number; row: CareerAtlasRow }> = [];

  for (const p of lisans) {
    const s = scoreProgram(p, terms);
    if (s > 0) scored.push({ score: s, row: mapRow("lisans", p) });
  }
  for (const p of onlisans) {
    const s = scoreProgram(p, terms);
    if (s > 0) scored.push({ score: s, row: mapRow("onlisans", p) });
  }

  scored.sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const out: CareerAtlasRow[] = [];
  for (const { row } of scored) {
    const key = `${row.level}::${row.universite}::${row.bolum}`.toLocaleLowerCase("tr");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
    if (out.length >= limit) break;
  }
  return out;
}

function mergeProgramLists(lists: CareerAtlasRow[][]): CareerAtlasRow[] {
  const seen = new Set<string>();
  const out: CareerAtlasRow[] = [];
  for (const list of lists) {
    for (const row of list) {
      const key = `${row.level}::${row.programKodu || row.bolum}::${row.universite}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(row);
    }
  }
  return out;
}

function extractHedefFromContext(
  contextData: unknown
): CareerGroundTruth["hedef"] {
  const resolved = resolveStudentHedef(contextData);
  if (!resolved) return null;
  return {
    universite: resolved.universite,
    bolum: resolved.bolum,
    aciklama: resolved.aciklama,
  };
}

function buildHedefSearchTerms(hedef: ResolvedStudentHedef | null): string[] {
  if (!hedef) return [];
  const terms: string[] = [];
  if (hedef.universite && hedef.bolum) {
    terms.push(`${hedef.universite} ${hedef.bolum}`);
  }
  if (hedef.bolum) terms.push(hedef.bolum);
  if (hedef.universite && !hedef.bolum) terms.push(hedef.universite);
  if (hedef.aciklama && terms.length === 0) terms.push(hedef.aciklama);
  return [...new Set(terms.map((s) => s.trim()).filter(Boolean))];
}

/** Panel bağlamından öğrenci deneme netleri — uydurma yok; Supabase öncelikli */
export function extractOgrenciNetleriFromContext(
  contextData: unknown
): OgrenciNetSnapshot {
  if (!contextData || typeof contextData !== "object") {
    return snapshotBulunamadi(false);
  }

  const ctx = contextData as Record<string, unknown>;

  const supabaseRaw = ctx.supabaseSonDeneme;
  if (supabaseRaw && typeof supabaseRaw === "object") {
    const s = supabaseRaw as Record<string, unknown>;
    const authoritative = s.kaynak === "appwrite" || s.kaynak === "supabase";
    const nets: LatestDenemeNetsResult = {
      authoritative,
      durum: s.durum === "mevcut" ? "mevcut" : "bulunamadi",
      sonTyTNet:
        s.sonTyTNet != null && Number.isFinite(Number(s.sonTyTNet))
          ? Number(s.sonTyTNet)
          : null,
      sonAytNet:
        s.sonAytNet != null && Number.isFinite(Number(s.sonAytNet))
          ? Number(s.sonAytNet)
          : null,
      examName: String(s.examName ?? "").trim() || undefined,
      tarih: String(s.tarih ?? "").trim() || undefined,
    };
    return snapshotFromLatestNets(nets);
  }

  const kurumsalOz = ctx.kurumsalDenemeOzeti;
  if (kurumsalOz && typeof kurumsalOz === "object") {
    const o = kurumsalOz as Record<string, unknown>;
    const sonDenemeler: OgrenciNetSnapshot["sonDenemeler"] = [];
    const tyt = o.sonTyTNet;
    const ayt = o.sonAytNet;
    if (tyt != null && Number.isFinite(Number(tyt))) {
      sonDenemeler.push({
        ad: "Son TYT (kurumsal)",
        sinav: "TYT",
        net: Number(tyt),
        tarih: String(o.sonDenemeTarihi ?? ""),
      });
    }
    if (ayt != null && Number.isFinite(Number(ayt))) {
      sonDenemeler.push({
        ad: "Son AYT (kurumsal)",
        sinav: "AYT",
        net: Number(ayt),
        tarih: String(o.sonDenemeTarihi ?? ""),
      });
    }
    if (sonDenemeler.length > 0) {
      return snapshotFromLatestNets({
        authoritative: o.kaynak === "appwrite" || o.kaynak === "supabase",
        durum: "mevcut",
        sonTyTNet:
          tyt != null && Number.isFinite(Number(tyt)) ? Number(tyt) : null,
        sonAytNet:
          ayt != null && Number.isFinite(Number(ayt)) ? Number(ayt) : null,
        tarih: String(o.sonDenemeTarihi ?? ""),
      });
    }
  }

  const denemeler = ctx.sonUcDeneme;
  if (!Array.isArray(denemeler) || denemeler.length === 0) {
    return snapshotBulunamadi(false);
  }

  const sonDenemeler = denemeler
    .slice(0, 3)
    .map((d) => {
      const row = d as Record<string, unknown>;
      const netRaw = row.net;
      const net =
        netRaw != null && netRaw !== "" && Number.isFinite(Number(netRaw))
          ? Number(netRaw)
          : null;
      return {
        ad: String(row.ad ?? "Deneme").trim(),
        sinav: String(row.sinav ?? "—").trim(),
        net,
        tarih: String(row.tarih ?? "").trim(),
      };
    })
    .filter((d) => d.ad);

  if (sonDenemeler.length === 0) {
    return snapshotBulunamadi(false);
  }

  const tytRow = sonDenemeler.find((d) =>
    String(d.sinav).toUpperCase().includes("TYT")
  );
  const aytRow = sonDenemeler.find((d) =>
    String(d.sinav).toUpperCase().includes("AYT")
  );

  return snapshotFromLatestNets({
    authoritative: false,
    durum: "mevcut",
    sonTyTNet: tytRow?.net ?? null,
    sonAytNet: aytRow?.net ?? null,
    tarih: sonDenemeler[0]?.tarih,
  });
}

function snapshotBulunamadi(authoritative: boolean): OgrenciNetSnapshot {
  const nets: LatestDenemeNetsResult = {
    authoritative,
    durum: "bulunamadi",
    sonTyTNet: null,
    sonAytNet: null,
  };
  return snapshotFromLatestNets(nets);
}

function snapshotFromLatestNets(
  nets: LatestDenemeNetsResult
): OgrenciNetSnapshot {
  const promptNotu = buildDenemeNetPromptBlock(nets);

  if (nets.durum !== "mevcut") {
    return {
      durum: "bulunamadi",
      sonTyTNet: null,
      sonAytNet: null,
      sonDenemeler: [],
      ozetMetin: null,
      promptNotu,
    };
  }

  const sonDenemeler: OgrenciNetSnapshot["sonDenemeler"] = [];
  if (nets.sonTyTNet != null) {
    sonDenemeler.push({
      ad: nets.examName || "Son TYT denemesi",
      sinav: "TYT",
      net: nets.sonTyTNet,
      tarih: nets.tarih ?? "",
    });
  }
  if (nets.sonAytNet != null) {
    sonDenemeler.push({
      ad: nets.examName || "Son AYT denemesi",
      sinav: "AYT",
      net: nets.sonAytNet,
      tarih: nets.tarih ?? "",
    });
  }

  const ozetMetin = sonDenemeler
    .map((d) => `${d.ad} (${d.sinav}): ${d.net} net`)
    .join(" · ");

  return {
    durum: "mevcut",
    sonTyTNet: nets.sonTyTNet,
    sonAytNet: nets.sonAytNet,
    sonDenemeler,
    ozetMetin: ozetMetin || null,
    promptNotu,
  };
}

function buildStrictVeriBloku(
  ground: Omit<CareerGroundTruth, "strictVeriBloku">,
  maxPrograms = 24
): string {
  const programs = ground.gercekTabanPuanlar.programlar
    .slice(0, maxPrograms)
    .map((p) => ({
      u: p.universite,
      b: p.bolum,
      p: p.puanTipi,
      t: p.tabanPuani,
      s: p.basariSirasi,
    }));

  const taban = {
    durum: ground.gercekTabanPuanlar.durum,
    arama: ground.gercekTabanPuanlar.aramaTerimleri,
    programlar: programs,
  };

  return `[GERÇEK VERİLER]
Netler: ${JSON.stringify(ground.ogrenciNetleri)}
${ground.ogrenciNetleri.promptNotu ? `${ground.ogrenciNetleri.promptNotu}\n` : ""}Atlas: ${JSON.stringify(taban)}
${ground.hedef ? `HEDEF (profil — ana analiz konusu): ${JSON.stringify(ground.hedef)}` : "HEDEF: kayıtlı hedef yok — kullanıcı sorusundaki bölüm adını netleştir"}
[LİSTE SONU]`;
}

/**
 * AI çağrısından önce: öğrenci netleri + YÖK Atlas taban verilerini toplar.
 * Yalnızca bu bloktaki programlar için taban puan / sıra kullanılabilir.
 */
export async function buildCareerGroundTruth(
  userQuery: string,
  contextData?: unknown,
  options?: { programLimit?: number }
): Promise<CareerGroundTruth> {
  const programLimit = options?.programLimit ?? 24;
  const ogrenciNetleri = extractOgrenciNetleriFromContext(contextData);
  const hedef = extractHedefFromContext(contextData);
  const resolvedHedef = resolveStudentHedef(contextData);

  const aramaTerimleri: string[] = [...buildHedefSearchTerms(resolvedHedef)];

  const q = userQuery.trim();
  if (q && aramaTerimleri.length === 0) {
    aramaTerimleri.push(q);
  } else if (q && aramaTerimleri.length > 0 && aramaTerimleri.length < 3) {
    aramaTerimleri.push(q);
  }

  const uniqueQueries = [
    ...new Set(aramaTerimleri.map((s) => s.trim()).filter(Boolean)),
  ];

  const perQueryLimit = Math.max(4, Math.ceil(programLimit / 2));
  const programBatches = await Promise.all(
    uniqueQueries.slice(0, 3).map((term) => searchPrograms(term, perQueryLimit))
  );
  const programlar = mergeProgramLists(programBatches).slice(0, programLimit);

  const relatedTerms = getRelatedDepartmentSearchTerms(resolvedHedef?.bolum);
  const parlakBatches = await Promise.all(
    relatedTerms.slice(0, 4).map((term) => searchPrograms(term, 5))
  );
  const parlakProgramlar = pickDiverseParlakPrograms(
    mergeProgramLists(parlakBatches),
    { hedef: resolvedHedef, excludePrograms: programlar, max: 8 }
  );

  const gercekTabanPuanlar: CareerGroundTruth["gercekTabanPuanlar"] = {
    durum: programlar.length > 0 ? "mevcut" : "bulunamadi",
    aramaTerimleri: uniqueQueries,
    programlar,
  };

  const base = { ogrenciNetleri, hedef, gercekTabanPuanlar, parlakProgramlar };
  return {
    ...base,
    strictVeriBloku: buildStrictVeriBloku(base, programLimit),
  };
}

/** @deprecated metin alanı — buildCareerRagContext içinde strictVeriBloku kullanılır */
function buildLegacyMetin(
  ground: CareerGroundTruth,
  userQuery: string
): string {
  const tablo =
    ground.gercekTabanPuanlar.programlar.length === 0
      ? "Veri bulunamadı — taban puan, başarı sırası veya üniversite adı UYDURMA."
      : ground.gercekTabanPuanlar.programlar
          .map(
            (p, i) =>
              `${i + 1}. [${p.level.toUpperCase()}] ${p.universite} · ${p.bolum} | Kod: ${p.programKodu || "—"} | Puan türü: ${p.puanTipi || "—"} | Taban: ${p.tabanPuani || "—"} | Başarı sırası: ${p.basariSirasi || "—"} | Kontenjan: ${p.kontenjan || "—"}`
          )
          .join("\n");

  const netSatir =
    ground.ogrenciNetleri.durum === "mevcut"
      ? ground.ogrenciNetleri.ozetMetin
      : "Veri bulunamadı — net karşılaştırması yapma; mevcutDurum alanında bunu yaz. TYT neti 0 yazma.";

  return `[KARİYER VERİ TABANI — YÖK Atlas]
Kaynak: data/yok-atlas-lisans.json + data/yok-atlas-onlisans.json
Kullanıcı sorusu: "${userQuery.trim()}"
${netSatir ? `Öğrenci denemeleri: ${netSatir}` : ""}

PROGRAM TABLOSU:
${tablo}

${ground.strictVeriBloku}`;
}

/** YÖK Atlas tabanlı Strict RAG — halüsinasyonu önlemek için zorunlu */
export async function buildCareerRagContext(
  userQuery: string,
  contextData?: unknown,
  options?: { programLimit?: number }
): Promise<{
  aramaTerimi: string;
  programlar: CareerAtlasRow[];
  parlakProgramlar: CareerAtlasRow[];
  ogrenciOzeti: string | null;
  groundTruth: CareerGroundTruth;
  metin: string;
}> {
  const aramaTerimi = userQuery.trim();
  const groundTruth = await buildCareerGroundTruth(userQuery, contextData, options);
  const metin = buildLegacyMetin(groundTruth, aramaTerimi);

  return {
    aramaTerimi,
    programlar: groundTruth.gercekTabanPuanlar.programlar,
    parlakProgramlar: groundTruth.parlakProgramlar ?? [],
    ogrenciOzeti: groundTruth.ogrenciNetleri.ozetMetin,
    groundTruth,
    metin,
  };
}

export function mergeCareerIntoStudentContext(
  contextData: unknown,
  rag: Awaited<ReturnType<typeof buildCareerRagContext>>
): Record<string, unknown> {
  const base =
    contextData && typeof contextData === "object" && !Array.isArray(contextData)
      ? { ...(contextData as Record<string, unknown>) }
      : {};
  return {
    ...base,
    kariyerModu: true,
    kariyerVeriTabani: {
      arama: rag.aramaTerimi,
      programSayisi: rag.programlar.length,
      programlar: rag.programlar,
      parlakProgramlar: rag.parlakProgramlar,
      ogrenciNetleri: rag.groundTruth.ogrenciNetleri,
      gercekTabanPuanlar: rag.groundTruth.gercekTabanPuanlar,
      strictVeriBloku: rag.groundTruth.strictVeriBloku,
      ozetMetin: rag.metin,
    },
  };
}
