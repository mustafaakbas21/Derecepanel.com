import { NextResponse } from "next/server";

import { upsertSoruHavuzuMeta } from "@/lib/appwrite/soru-havuzu-server";
import { AuthError, requireCoachAuth } from "@/lib/auth/require-coach-server";

export async function POST(request: Request) {
  try {
    const session = await requireCoachAuth();
    const body = (await request.json().catch(() => ({}))) as {
      coachId?: string;
      entityId?: string;
      payload?: string;
      examId?: string;
    };

    if (!body.entityId || !body.payload) {
      return NextResponse.json({ error: "entityId ve payload gerekli" }, { status: 400 });
    }

    const coachId = body.coachId?.trim() || session.coachId;

    await upsertSoruHavuzuMeta({
      coachId,
      ownerId: session.coachId,
      entityId: body.entityId,
      examId: body.examId,
      payload: body.payload,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
