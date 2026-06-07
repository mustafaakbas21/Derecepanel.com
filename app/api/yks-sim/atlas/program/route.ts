import { NextResponse } from "next/server";

import { AuthError } from "@/lib/auth/require-coach";
import { requireYksSimRead } from "@/lib/auth/require-yks-sim";
import { getLisansProgramByKodu } from "@/lib/yks-sim/atlas-cache";
import { resolveNets } from "@/lib/yks-sim/net-resolve";

export async function GET(request: Request) {
  try {
    await requireYksSimRead(request);
    const url = new URL(request.url);
    const programKodu = url.searchParams.get("programKodu")?.trim();
    if (!programKodu) {
      return NextResponse.json({ error: "programKodu gerekli" }, { status: 400 });
    }

    const program = await getLisansProgramByKodu(programKodu);
    if (!program) {
      return NextResponse.json({ error: "Program bulunamadı" }, { status: 404 });
    }

    const resolved = resolveNets(program);

    return NextResponse.json({
      program,
      nets: resolved.nets,
      bands: resolved.bands,
      source: resolved.source,
      spec: resolved.spec,
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
