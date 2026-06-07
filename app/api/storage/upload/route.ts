import { NextResponse } from "next/server";

import {
  APPWRITE_BUCKET_DENEME_DEPOSU,
  APPWRITE_BUCKET_SORU_HAVUZU,
} from "@/lib/appwrite/config";
import { uploadBufferToBucket } from "@/lib/appwrite/storage-server";
import { getServerAuthSession } from "@/lib/auth/session-server";

const ALLOWED_BUCKETS = new Set([APPWRITE_BUCKET_SORU_HAVUZU, APPWRITE_BUCKET_DENEME_DEPOSU]);

function resolveBucket(requested: string | null): string {
  const bucket = requested?.trim() || APPWRITE_BUCKET_SORU_HAVUZU;
  return ALLOWED_BUCKETS.has(bucket) ? bucket : APPWRITE_BUCKET_SORU_HAVUZU;
}

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "Dosya gerekli" }, { status: 400 });
  }

  const bucketId = resolveBucket(
    typeof form.get("bucketId") === "string" ? String(form.get("bucketId")) : null
  );
  const filename =
    file instanceof File && file.name
      ? file.name
      : String(form.get("filename") || "upload.bin");

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const tryUpload = async (targetBucket: string) =>
      uploadBufferToBucket({
        bucketId: targetBucket,
        buffer,
        filename,
        mimeType: file.type || undefined,
      });

    let uploaded;
    try {
      uploaded = await tryUpload(bucketId);
    } catch (firstErr) {
      const msg = String((firstErr as Error)?.message || "").toLowerCase();
      const bucketMissing = /bucket.*not found|could not be found|404/.test(msg);
      if (bucketMissing && bucketId !== APPWRITE_BUCKET_SORU_HAVUZU) {
        uploaded = await tryUpload(APPWRITE_BUCKET_SORU_HAVUZU);
      } else {
        throw firstErr;
      }
    }

    return NextResponse.json(uploaded);
  } catch (err) {
    const message = String((err as Error)?.message || "Yükleme başarısız");
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
