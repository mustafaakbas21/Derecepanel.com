import "server-only";

import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID } from "@/lib/appwrite/config";
import { isAppwriteServerConfigured } from "@/lib/appwrite/server";

function readApiKey(): string {
  return process.env.APPWRITE_API_KEY?.trim() ?? "";
}

export async function downloadBucketFileBuffer(
  bucketId: string,
  fileId: string
): Promise<{ buffer: Buffer; mimeType: string }> {
  if (!isAppwriteServerConfigured()) {
    throw new Error("Appwrite storage yapılandırması eksik.");
  }

  const apiKey = readApiKey();
  const url = `${APPWRITE_ENDPOINT}/storage/buckets/${encodeURIComponent(bucketId)}/files/${encodeURIComponent(fileId)}/download`;
  const res = await fetch(url, {
    headers: {
      "X-Appwrite-Project": APPWRITE_PROJECT_ID,
      "X-Appwrite-Key": apiKey,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Dosya indirilemedi (HTTP ${res.status})`);
  }

  const mimeType = res.headers.get("content-type") || "application/octet-stream";
  const arrayBuffer = await res.arrayBuffer();
  return { buffer: Buffer.from(arrayBuffer), mimeType };
}
