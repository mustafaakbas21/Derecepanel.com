import { NextResponse } from "next/server";

import { AuthError, requireCoachAuth } from "@/lib/auth/require-coach-server";

/**
 * MVP: Öğrenci kataloğu istemci `students_full_v1` / import yanıtı ile senkron.
 * POST body ile catalog snapshot gönderilerek import ACL doğrulanır.
 */
export async function GET(request: Request) {
  try {
    const session = await requireCoachAuth(request);
    const coachId = new URL(request.url).searchParams.get("coachId");
    if (session.role === "coach" && coachId && coachId !== session.coachId) {
      return NextResponse.json({ error: "Yetkisiz coachId" }, { status: 403 });
    }
    return NextResponse.json({
      source: "client-localStorage",
      students: [],
      hint: "İstemcide loadCatalogStudents() kullanın.",
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
