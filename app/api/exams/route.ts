import { NextResponse } from "next/server";

import { AuthError, requireCoachAuth } from "@/lib/auth/require-coach-server";

/**
 * MVP: Deneme listesi istemci localStorage'da (`kurum_denemeler_v1`).
 * API yanıtı istemcinin `loadExamsBuckets` fallback'ini doğrular.
 */
export async function GET(request: Request) {
  try {
    await requireCoachAuth(request);
    const scope = new URL(request.url).searchParams.get("scope") || "all";
    return NextResponse.json({
      scope,
      source: "client-localStorage",
      kurumsal: [],
      global: [],
      hint: "Liste istemcide loadExamsBuckets() ile okunur; sunucu DB bağlanınca bu endpoint doldurulacak.",
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
