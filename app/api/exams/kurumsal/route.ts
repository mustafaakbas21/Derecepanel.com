import { NextResponse } from "next/server";

import { AuthError, requireCoachAuth } from "@/lib/auth/require-coach-server";
import { enrichKurumDeneme } from "@/lib/exams/enrich-exam";
import { loadKurumDenemelerMerged } from "@/lib/exams/migrate-kurum";
import type { KurumDeneme } from "@/lib/exams/types";

function filterList(
  list: KurumDeneme[],
  params: URLSearchParams,
  coachId: string,
  role: string
) {
  let out = list;
  if (role === "coach") {
    out = out.filter((e) => !e.coachId || e.coachId === coachId);
  }
  const search = params.get("search")?.trim().toLowerCase();
  const durum = params.get("durum");
  const sinav = params.get("sinav");
  if (search) out = out.filter((e) => String(e.ad || "").toLowerCase().includes(search));
  if (durum && durum !== "tumu") out = out.filter((e) => e.durum === durum);
  if (sinav && sinav !== "tumu") out = out.filter((e) => e.sinav === sinav);
  return out;
}

export async function GET(request: Request) {
  try {
    const session = await requireCoachAuth(request);
    const url = new URL(request.url);
    const list = filterList(
      loadKurumDenemelerMerged(),
      url.searchParams,
      session.coachId,
      session.role
    );
    return NextResponse.json({
      exams: list,
      source: "client-sync",
      hint: "MVP: kalıcı yazma istemci localStorage; API doğrulama için.",
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireCoachAuth(request);
    const body = (await request.json()) as KurumDeneme;
    const enriched = enrichKurumDeneme({ ...body, scope: "kurumsal" });
    return NextResponse.json({ exam: enriched });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
