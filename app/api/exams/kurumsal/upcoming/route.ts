import { NextResponse } from "next/server";

import { AuthError, requireCoachAuth } from "@/lib/auth/require-coach-server";
import { loadUpcomingKurumDenemelerForStudent } from "@/lib/exams/exam-storage";

export async function GET(_request: Request) {
  try {
    await requireCoachAuth();
    const exams = loadUpcomingKurumDenemelerForStudent();
    return NextResponse.json({ exams });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
