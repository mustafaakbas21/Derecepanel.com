import { NextResponse } from "next/server";

import { readChatImageAttachment } from "@/lib/db/chat-attachments";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ error: "id gerekli" }, { status: 400 });
  }

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
}
