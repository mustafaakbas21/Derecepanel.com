import { NextResponse } from "next/server";

import {
  APPWRITE_BUCKET_DENEME_DEPOSU,
  APPWRITE_BUCKET_SORU_HAVUZU,
} from "@/lib/appwrite/config";
import { downloadBucketFileBuffer } from "@/lib/appwrite/download-server";
import { getServerAuthSession } from "@/lib/auth/session-server";

const ALLOWED_BUCKETS = new Set([APPWRITE_BUCKET_SORU_HAVUZU, APPWRITE_BUCKET_DENEME_DEPOSU]);

export async function GET(request: Request) {
  const session = await getServerAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  }

  const url = new URL(request.url);
  const bucketId = url.searchParams.get("bucketId")?.trim() || "";
  const fileId = url.searchParams.get("fileId")?.trim() || "";

  if (!bucketId || !fileId || !ALLOWED_BUCKETS.has(bucketId)) {
    return NextResponse.json({ error: "Geçersiz bucket veya fileId" }, { status: 400 });
  }

  try {
    const { buffer, mimeType } = await downloadBucketFileBuffer(bucketId, fileId);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    const message = String((err as Error)?.message || "Dosya alınamadı");
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
