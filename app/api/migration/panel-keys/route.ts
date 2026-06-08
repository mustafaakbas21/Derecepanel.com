import { NextResponse } from "next/server";

import { saveBridgedPanelKey } from "@/lib/appwrite/collection-bridge";
import { isAppwriteServerConfigured } from "@/lib/appwrite/server";
import { AuthError, requireCoachAuth } from "@/lib/auth/require-coach-server";

export async function POST(request: Request) {
  try {
    const session = await requireCoachAuth();
    if (!isAppwriteServerConfigured()) {
      return NextResponse.json({ error: "Appwrite yapılandırması eksik" }, { status: 503 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      keys?: Record<string, string>;
    };

    const coachId = session.coachId;
    const keys = body.keys ?? {};
    let synced = 0;

    for (const [dataKey, payload] of Object.entries(keys)) {
      if (!payload) continue;
      await saveBridgedPanelKey(coachId, dataKey, payload);
      synced += 1;
    }

    return NextResponse.json({ synced });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
