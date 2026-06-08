import { NextResponse } from "next/server";

import { AuthError } from "@/lib/auth/require-coach";
import {
  assertOnyxStudentAccess,
  requireOnyxAuth,
} from "@/lib/auth/require-onyx";
import {
  getChatAttachmentSessionId,
  readChatImageAttachment,
} from "@/lib/db/chat-attachments";
import { getChatSessionStudentId } from "@/lib/db/chat-memory";

export async function GET(request: Request) {
  try {
    const ctx = await requireOnyxAuth();
    const id = new URL(request.url).searchParams.get("id")?.trim();
    if (!id) {
      return NextResponse.json({ error: "id gerekli" }, { status: 400 });
    }

    const sessionId = await getChatAttachmentSessionId(id);
    if (!sessionId) {
      return NextResponse.json({ error: "Görsel bulunamadı" }, { status: 404 });
    }

    const studentId = await getChatSessionStudentId(sessionId);
    if (!studentId) {
      return NextResponse.json({ error: "Görsel bulunamadı" }, { status: 404 });
    }

    await assertOnyxStudentAccess(ctx, studentId);

    const file = await readChatImageAttachment(id);
    if (!file) {
      return NextResponse.json({ error: "Görsel bulunamadı" }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(file.buffer), {
      headers: {
        "Content-Type": file.mimeType,
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
