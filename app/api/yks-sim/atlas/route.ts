import { NextResponse } from "next/server";

import { AuthError } from "@/lib/auth/require-coach";
import { requireYksSimRead } from "@/lib/auth/require-yks-sim";
import {
  getAtlasMetaCached,
  getAtlasSearchIndex,
  getEnrichedAtlas,
} from "@/lib/yks-sim/atlas-cache";
import type { BolumDili } from "@/lib/yks-sim/atlas-program-display";
import {
  filterAtlasPrograms,
  filterAtlasProgramsExtendedIndexed,
  uniqueUniversities,
} from "@/lib/yks-sim/atlas-filter";

function parseList(param: string | null): string[] {
  if (!param?.trim()) return [];
  return param
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseLevel(raw: string | null): "lisans" | "onlisans" | "all" {
  if (raw === "onlisans") return "onlisans";
  if (raw === "all") return "all";
  return "lisans";
}

export async function GET(request: Request) {
  try {
    await requireYksSimRead(request);
    const url = new URL(request.url);
    const level = parseLevel(url.searchParams.get("level"));
    const metaOnly = url.searchParams.get("meta") === "1";
    if (metaOnly) {
      return NextResponse.json(await getAtlasMetaCached(level));
    }

    const extended =
      url.searchParams.has("year") ||
      url.searchParams.has("puanTipi") ||
      url.searchParams.has("page") ||
      url.searchParams.has("pageSize") ||
      url.searchParams.has("bsMin") ||
      url.searchParams.has("kurum") ||
      url.searchParams.has("burs") ||
      url.searchParams.has("bolumDili") ||
      url.searchParams.has("deprem");

    if (extended) {
      const puanTipleri = parseList(url.searchParams.get("puanTipi"));
      const bsMinRaw = url.searchParams.get("bsMin");
      const bsMaxRaw = url.searchParams.get("bsMax");
      const bolumDiliRaw = parseList(url.searchParams.get("bolumDili")) as BolumDili[];
      const depremRaw = url.searchParams.get("deprem");
      const index = await getAtlasSearchIndex(level);
      const result = filterAtlasProgramsExtendedIndexed(index, {
        year: url.searchParams.get("year") || "2025",
        puanTipleri: puanTipleri.length ? puanTipleri : undefined,
        sehirler: parseList(url.searchParams.get("sehir")),
        universiteler: parseList(url.searchParams.get("universite")),
        bolumler: parseList(url.searchParams.get("bolum")),
        bsMin: bsMinRaw != null && bsMinRaw !== "" ? Number(bsMinRaw) : null,
        bsMax: bsMaxRaw != null && bsMaxRaw !== "" ? Number(bsMaxRaw) : null,
        kurum: url.searchParams.get("kurum") || undefined,
        ogrenim: url.searchParams.get("ogrenim") || undefined,
        burs: parseList(url.searchParams.get("burs")),
        bolumDili: bolumDiliRaw.length ? bolumDiliRaw : undefined,
        depremKontenjan:
          depremRaw === "var" || depremRaw === "yok" ? depremRaw : undefined,
        search: url.searchParams.get("search") || undefined,
        page: Number(url.searchParams.get("page") || "1"),
        pageSize: Math.min(100, Math.max(10, Number(url.searchParams.get("pageSize") || "50"))),
      });

      const pagePrograms = result.rows.map(({ _search: _s, _nsStrength: _n, ...rest }) => rest);

      return NextResponse.json({
        programs: pagePrograms,
        total: index.programs.length,
        filtered: result.total,
        page: Number(url.searchParams.get("page") || "1"),
        pageSize: Number(url.searchParams.get("pageSize") || "50"),
        puanRelaxed: result.puanRelaxed,
      });
    }

    const programs = await getEnrichedAtlas(level);

    const fullList = url.searchParams.get("full") === "1";
    if (fullList) {
      return NextResponse.json({
        programs,
        total: programs.length,
        filtered: programs.length,
      });
    }

    const universitiesOnly = url.searchParams.get("universities") === "1";
    if (universitiesOnly) {
      const filtered = filterAtlasPrograms(programs, {
        search: url.searchParams.get("search") || undefined,
        puanTipi: url.searchParams.get("puanTipi") || undefined,
        sehir: url.searchParams.get("sehir") || undefined,
        limit: 50_000,
      });
      return NextResponse.json({
        universities: uniqueUniversities(filtered),
        total: programs.length,
        filtered: filtered.length,
      });
    }

    const filtered = filterAtlasPrograms(programs, {
      search: url.searchParams.get("search") || undefined,
      puanTipi: url.searchParams.get("puanTipi") || undefined,
      sehir: url.searchParams.get("sehir") || undefined,
      universite: url.searchParams.get("universite") || undefined,
      limit: Number(url.searchParams.get("limit") || "200"),
    });

    return NextResponse.json({
      programs: filtered,
      total: programs.length,
      filtered: filtered.length,
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
