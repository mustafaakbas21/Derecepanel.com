import { NextResponse } from "next/server";

import { syncStudentsBatch } from "@/lib/appwrite/students-server";
import { AuthError, requireCoachAuth } from "@/lib/auth/require-coach-server";
import type { StudentRecord } from "@/lib/students/types";

export async function POST(request: Request) {
  try {
    await requireCoachAuth();
    const body = (await request.json().catch(() => ({}))) as {
      students?: StudentRecord[];
      provisionAuth?: boolean;
    };

    if (!Array.isArray(body.students)) {
      return NextResponse.json({ error: "students dizisi gerekli" }, { status: 400 });
    }

    const result = await syncStudentsBatch(body.students, {
      provisionAuth: body.provisionAuth !== false,
    });

    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
