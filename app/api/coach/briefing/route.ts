import { NextResponse } from "next/server";

import { AuthError, requireCoachAuth } from "@/lib/auth/require-coach-server";
import type { CoachBriefingSyncPayload } from "@/lib/coach/coach-briefing-sync";
import { buildCoachBriefing } from "@/lib/coach/coach-briefing-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const session = await requireCoachAuth(request);
    let sync: CoachBriefingSyncPayload | undefined;

    try {
      const body = (await request.json()) as Partial<CoachBriefingSyncPayload>;
      if (body && typeof body === "object" && Array.isArray(body.students)) {
        sync = {
          appointments: Array.isArray(body.appointments) ? body.appointments : [],
          students: body.students,
          examResults: Array.isArray(body.examResults) ? body.examResults : [],
          examPackages: Array.isArray(body.examPackages)
            ? body.examPackages
            : [],
          mergedExams: Array.isArray(body.mergedExams) ? body.mergedExams : [],
        };
      }
    } catch {
      /* Supabase-only mod — gövde opsiyonel */
    }

    const data = await buildCoachBriefing(session.coachId, sync);
    return NextResponse.json(data);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    const message =
      e instanceof Error ? e.message : "Brifing oluşturulamadı.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
