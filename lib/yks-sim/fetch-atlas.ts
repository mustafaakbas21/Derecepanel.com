import { clientAuthHeaders } from "@/lib/auth/require-coach";
import type { YokAtlasProgram } from "@/lib/universities/types";
import type { BranchSpecItem, NetBand, ResolveNetsResult } from "@/lib/yks-sim/net-resolve";
import type { NsBranchId } from "@/lib/yks-sim/types";

export type AtlasMeta = {
  cities: string[];
  universities: string[];
  bolumler: string[];
  puanTipleri: string[];
  total: number;
};

export type AtlasExtendedParams = {
  level?: "lisans" | "onlisans" | "all";
  year?: string;
  puanTipleri?: string[];
  sehirler?: string[];
  universiteler?: string[];
  bolumler?: string[];
  bsMin?: string;
  bsMax?: string;
  kurum?: string;
  ogrenim?: string;
  burs?: string[];
  bolumDili?: string[];
  depremKontenjan?: "" | "var" | "yok";
  search?: string;
  page?: number;
  pageSize?: number;
};

export type AtlasExtendedResult = {
  programs: YokAtlasProgram[];
  total: number;
  filtered: number;
  page: number;
  pageSize: number;
  puanRelaxed?: boolean;
};

function authFetch(url: string) {
  return fetch(url, { headers: clientAuthHeaders() });
}

const atlasMetaCache = new Map<string, AtlasMeta>();

function readMetaCache(level: string): AtlasMeta | null {
  return atlasMetaCache.get(level) ?? null;
}

function writeMetaCache(level: string, meta: AtlasMeta) {
  atlasMetaCache.set(level, meta);
}

/** Tek seferlik tam atlas — istemci filtre/sayfalama için */
export async function fetchFullAtlasPrograms(
  level: "lisans" | "onlisans" | "all" = "lisans"
): Promise<YokAtlasProgram[]> {
  const res = await authFetch(`/api/yks-sim/atlas?full=1&level=${level}`);
  if (!res.ok) throw new Error("Atlas yüklenemedi");
  const data = (await res.json()) as { programs: YokAtlasProgram[] };
  return data.programs;
}

export async function fetchAtlasMeta(
  level: "lisans" | "onlisans" | "all" = "all"
): Promise<AtlasMeta> {
  const cached = readMetaCache(level);
  if (cached) {
    void authFetch(`/api/yks-sim/atlas?meta=1&level=${level}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((fresh) => {
        if (fresh && typeof fresh === "object") {
          const m = fresh as Partial<AtlasMeta>;
          writeMetaCache(level, {
            cities: Array.isArray(m.cities) ? m.cities : [],
            universities: Array.isArray(m.universities) ? m.universities : [],
            bolumler: Array.isArray(m.bolumler) ? m.bolumler : [],
            puanTipleri: Array.isArray(m.puanTipleri) ? m.puanTipleri : [],
            total: typeof m.total === "number" ? m.total : 0,
          });
        }
      })
      .catch(() => {});
    return {
      cities: Array.isArray(cached.cities) ? cached.cities : [],
      universities: Array.isArray(cached.universities) ? cached.universities : [],
      bolumler: Array.isArray(cached.bolumler) ? cached.bolumler : [],
      puanTipleri: Array.isArray(cached.puanTipleri) ? cached.puanTipleri : [],
      total: typeof cached.total === "number" ? cached.total : 0,
    };
  }

  const res = await authFetch(`/api/yks-sim/atlas?meta=1&level=${level}`);
  if (!res.ok) throw new Error("Atlas meta yüklenemedi");
  const meta = (await res.json()) as Partial<AtlasMeta>;
  const normalized: AtlasMeta = {
    cities: Array.isArray(meta.cities) ? meta.cities : [],
    universities: Array.isArray(meta.universities) ? meta.universities : [],
    bolumler: Array.isArray(meta.bolumler) ? meta.bolumler : [],
    puanTipleri: Array.isArray(meta.puanTipleri) ? meta.puanTipleri : [],
    total: typeof meta.total === "number" ? meta.total : 0,
  };
  writeMetaCache(level, normalized);
  return normalized;
}

let atlasProgramsAbort: AbortController | null = null;

export async function fetchAtlasProgramsExtended(
  params: AtlasExtendedParams
): Promise<AtlasExtendedResult> {
  atlasProgramsAbort?.abort();
  atlasProgramsAbort = new AbortController();
  const signal = atlasProgramsAbort.signal;

  const q = new URLSearchParams();
  q.set("level", params.level ?? "all");
  if (params.year) q.set("year", params.year);
  if (params.puanTipleri?.length) q.set("puanTipi", params.puanTipleri.join(","));
  if (params.sehirler?.length) q.set("sehir", params.sehirler.join(","));
  if (params.universiteler?.length) q.set("universite", params.universiteler.join(","));
  if (params.bolumler?.length) q.set("bolum", params.bolumler.join(","));
  if (params.bsMin) q.set("bsMin", params.bsMin);
  if (params.bsMax) q.set("bsMax", params.bsMax);
  if (params.kurum) q.set("kurum", params.kurum);
  if (params.ogrenim) q.set("ogrenim", params.ogrenim);
  if (params.burs?.length) q.set("burs", params.burs.join(","));
  if (params.bolumDili?.length) q.set("bolumDili", params.bolumDili.join(","));
  if (params.depremKontenjan === "var" || params.depremKontenjan === "yok") {
    q.set("deprem", params.depremKontenjan);
  }
  if (params.search) q.set("search", params.search);
  q.set("page", String(params.page ?? 1));
  q.set("pageSize", String(params.pageSize ?? 50));

  const res = await authFetch(`/api/yks-sim/atlas?${q}`);
  if (!res.ok) throw new Error("Atlas yüklenemedi");
  return res.json();
}

const EXPORT_PAGE_SIZE = 100;
const MAX_EXPORT_ROWS = 800;

/** Yazdırma/PDF — tüm filtreli liste (sayfalı, abort yok) */
export async function fetchAllFilteredAtlasPrograms(
  params: Omit<AtlasExtendedParams, "page" | "pageSize">,
  options?: { maxRows?: number }
): Promise<{ programs: YokAtlasProgram[]; totalFiltered: number; truncated: boolean }> {
  const maxRows = options?.maxRows ?? MAX_EXPORT_ROWS;
  const all: YokAtlasProgram[] = [];
  let totalFiltered = 0;
  let page = 1;

  while (all.length < maxRows) {
    const q = new URLSearchParams();
    q.set("level", params.level ?? "lisans");
    if (params.year) q.set("year", params.year);
    if (params.puanTipleri?.length) q.set("puanTipi", params.puanTipleri.join(","));
    if (params.sehirler?.length) q.set("sehir", params.sehirler.join(","));
    if (params.universiteler?.length) q.set("universite", params.universiteler.join(","));
    if (params.bolumler?.length) q.set("bolum", params.bolumler.join(","));
    if (params.bsMin) q.set("bsMin", params.bsMin);
    if (params.bsMax) q.set("bsMax", params.bsMax);
    if (params.kurum) q.set("kurum", params.kurum);
    if (params.ogrenim) q.set("ogrenim", params.ogrenim);
    if (params.burs?.length) q.set("burs", params.burs.join(","));
    if (params.bolumDili?.length) q.set("bolumDili", params.bolumDili.join(","));
    if (params.depremKontenjan === "var" || params.depremKontenjan === "yok") {
      q.set("deprem", params.depremKontenjan);
    }
    if (params.search) q.set("search", params.search);
    q.set("page", String(page));
    q.set("pageSize", String(EXPORT_PAGE_SIZE));

    const res = await authFetch(`/api/yks-sim/atlas?${q}`);
    if (!res.ok) throw new Error("Atlas dışa aktarım yüklenemedi");

    const data = (await res.json()) as AtlasExtendedResult;
    totalFiltered = data.filtered;
    all.push(...data.programs);

    if (data.programs.length < EXPORT_PAGE_SIZE || all.length >= totalFiltered) break;
    page += 1;
  }

  const truncated = totalFiltered > all.length;
  return {
    programs: all.slice(0, maxRows),
    totalFiltered,
    truncated,
  };
}

export async function fetchAtlasPrograms(params: {
  search?: string;
  puanTipi?: string;
  sehir?: string;
  universite?: string;
  limit?: number;
  level?: "lisans" | "onlisans" | "all";
}): Promise<{ programs: YokAtlasProgram[]; total: number; filtered?: number }> {
  const q = new URLSearchParams();
  q.set("level", params.level ?? "lisans");
  if (params.search) q.set("search", params.search);
  if (params.puanTipi) q.set("puanTipi", params.puanTipi);
  if (params.sehir) q.set("sehir", params.sehir);
  if (params.universite) q.set("universite", params.universite);
  q.set("limit", String(params.limit ?? 500));

  const res = await authFetch(`/api/yks-sim/atlas?${q}`);
  if (!res.ok) throw new Error("Atlas yüklenemedi");
  const data = (await res.json()) as {
    programs?: YokAtlasProgram[];
    total?: number;
    filtered?: number;
  };
  return {
    programs: Array.isArray(data.programs) ? data.programs : [],
    total: data.total ?? 0,
    filtered: data.filtered,
  };
}

export async function fetchAtlasUniversities(params: {
  search?: string;
  puanTipi?: string;
  sehir?: string;
  level?: "lisans" | "onlisans" | "all";
}): Promise<{ universities: string[]; filtered: number }> {
  const q = new URLSearchParams();
  q.set("universities", "1");
  q.set("level", params.level ?? "lisans");
  if (params.search) q.set("search", params.search);
  if (params.puanTipi) q.set("puanTipi", params.puanTipi);
  if (params.sehir) q.set("sehir", params.sehir);

  const res = await authFetch(`/api/yks-sim/atlas?${q}`);
  if (!res.ok) throw new Error("Üniversite listesi yüklenemedi");
  const data = (await res.json()) as {
    universities?: string[];
    filtered?: number;
  };
  return {
    universities: Array.isArray(data.universities) ? data.universities : [],
    filtered: data.filtered ?? 0,
  };
}

export type AtlasProgramDetail = {
  program: YokAtlasProgram;
  nets: Partial<Record<NsBranchId, number>>;
  bands: Partial<Record<NsBranchId, NetBand>>;
  source: ResolveNetsResult["source"];
  spec: BranchSpecItem[];
};

export async function fetchAtlasProgram(
  programKodu: string
): Promise<AtlasProgramDetail> {
  const res = await authFetch(
    `/api/yks-sim/atlas/program?programKodu=${encodeURIComponent(programKodu)}`
  );
  if (!res.ok) throw new Error("Program detayı yüklenemedi");
  return res.json();
}
