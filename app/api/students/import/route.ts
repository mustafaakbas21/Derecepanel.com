import { NextResponse } from "next/server";

import { requireCoachAuth } from "@/lib/auth/require-coach";
import { applyStudentImport } from "@/lib/students/import/persist";
import { importApiRequestSchema } from "@/lib/students/import/validate";
import type { ImportApiResponse } from "@/lib/students/import/types";

const EMPTY_RESPONSE: ImportApiResponse = {
  success: false,
  imported: 0,
  skipped: 0,
  errors: [],
  records: [],
};

export async function POST(request: Request) {
  try {
    const session = await requireCoachAuth();
    if (!session.coachId) {
      return NextResponse.json(
        { ...EMPTY_RESPONSE, errors: [{ row: 0, reason: "Oturum gerekli" }] },
        { status: 401 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { ...EMPTY_RESPONSE, errors: [{ row: 0, reason: "Geçersiz JSON" }] },
        { status: 400 }
      );
    }

    const parsed = importApiRequestSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        {
          ...EMPTY_RESPONSE,
          errors: [
            {
              row: 0,
              reason: firstIssue?.message ?? "Doğrulama hatası",
            },
          ],
        },
        { status: 400 }
      );
    }

    const { students, existingStudentCodes } = parsed.data;
    const result = applyStudentImport(
      students,
      existingStudentCodes,
      session.coachId
    );

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      {
        ...EMPTY_RESPONSE,
        errors: [{ row: 0, reason: "Sunucu hatası" }],
      },
      { status: 500 }
    );
  }
}
