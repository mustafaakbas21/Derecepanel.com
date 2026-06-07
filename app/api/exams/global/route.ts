import { NextResponse } from "next/server";

import { AuthError, requireCoachAuth } from "@/lib/auth/require-coach-server";
import { enrichGlobalExam, loadGlobalExams, persistGlobalExams } from "@/lib/exams/global-exam-storage";
import type { GlobalExam } from "@/lib/exams/types";

export async function GET(request: Request) {
  try {
    await requireCoachAuth(request);
    const list = loadGlobalExams().map(enrichGlobalExam);
    return NextResponse.json({
      exams: list,
      source: "client-sync",
      hint: "MVP: kalıcı yazma istemci localStorage (global_exams_live + mirror).",
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireCoachAuth(request);
    const body = (await request.json()) as GlobalExam[] | { exams?: GlobalExam[] };
    const raw = Array.isArray(body) ? body : body.exams;
    if (!Array.isArray(raw)) {
      return NextResponse.json({ error: "Geçersiz gövde" }, { status: 400 });
    }
    const norm = persistGlobalExams(raw);
    return NextResponse.json({ exams: norm, count: norm.length });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
