import { NextResponse } from "next/server";

import { AuthError, requireCoachAuth } from "@/lib/auth/require-coach-server";
import { enrichKurumDeneme } from "@/lib/exams/enrich-exam";
import { loadKurumDenemelerMerged } from "@/lib/exams/migrate-kurum";
import type { KurumDeneme } from "@/lib/exams/types";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const session = await requireCoachAuth(_request);
    const { id } = await ctx.params;
    const item = loadKurumDenemelerMerged().find((x) => x.id === id);
    if (!item) {
      return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
    }
    if (session.role === "coach" && item.coachId && item.coachId !== session.coachId) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }
    return NextResponse.json({ exam: item });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    await requireCoachAuth(request);
    const { id } = await ctx.params;
    const body = (await request.json()) as KurumDeneme;
    const enriched = enrichKurumDeneme({ ...body, id, scope: "kurumsal" });
    return NextResponse.json({ exam: enriched });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function DELETE(request: Request, ctx: Ctx) {
  try {
    await requireCoachAuth(request);
    const { id } = await ctx.params;
    return NextResponse.json({
      ok: true,
      id,
      hint: "MVP: silme istemci localStorage üzerinden yapılır.",
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
