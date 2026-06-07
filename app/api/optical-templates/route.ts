import { NextResponse } from "next/server";

import { AuthError, requireCoachAuth } from "@/lib/auth/require-coach-server";
import { parseFmtText } from "@/lib/exams/fmt-parse";
import { DEFAULT_TABBED_TEMPLATE } from "@/lib/exams/fmt-store";

export async function GET(request: Request) {
  try {
    await requireCoachAuth(request);
    return NextResponse.json({
      source: "client-indexeddb",
      templates: [DEFAULT_TABBED_TEMPLATE],
      hint: "Tam liste istemcide fmtListAll() ile okunur.",
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireCoachAuth(request);
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = (await request.json()) as { text?: string; fileName?: string };
      const fmt = parseFmtText(body.text || "", body.fileName);
      return NextResponse.json({ template: fmt });
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file gerekli" }, { status: 400 });
    }
    const text = await file.text();
    const fmt = parseFmtText(text, file.name);
    return NextResponse.json({ template: fmt });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
