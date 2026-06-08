import { NextResponse } from "next/server";

import { AuthError, requireCoachAuth } from "@/lib/auth/require-coach-server";
import { validateImportRequest } from "@/lib/exams/import/exam-result-import.service";
import type { ExamResultImportRequest } from "@/lib/exams/import/types";

export async function POST(request: Request) {
  try {
    const session = await requireCoachAuth();

    let body: ExamResultImportRequest;
    try {
      body = (await request.json()) as ExamResultImportRequest;
    } catch {
      return NextResponse.json(
        { saved: 0, skipped: 0, errors: [{ rowId: "", message: "Geçersiz JSON" }] },
        { status: 400 }
      );
    }

    const aclRole =
      session.role === "admin" || session.role === "institution" ? "admin" : "coach";
    const result = validateImportRequest(body, {
      coachId: session.coachId,
      role: aclRole,
    });

    if (!body.examId) {
      return NextResponse.json(result, { status: 400 });
    }

    if (result.saved === 0 && result.errors.some((e) => e.message.includes("403"))) {
      return NextResponse.json(result, { status: 403 });
    }

    return NextResponse.json({
      saved: result.saved,
      skipped: result.skipped,
      errors: result.errors,
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json(
        { saved: 0, skipped: 0, errors: [{ rowId: "", message: e.message }] },
        { status: e.status }
      );
    }
    return NextResponse.json(
      { saved: 0, skipped: 0, errors: [{ rowId: "", message: "Sunucu hatası" }] },
      { status: 500 }
    );
  }
}
