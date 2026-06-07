import {
  APPWRITE_BUCKET_SORU_HAVUZU,
  resolveStorageBucket,
} from "@/lib/appwrite/config";
import { isCloudRef, parseCloudRef } from "@/lib/appwrite/storage-refs";

export type UploadBlobInput = {
  blob: Blob;
  filename: string;
  bucketId?: string;
  mimeType?: string;
};

export type UploadBlobResult = {
  fileId: string;
  bucketId: string;
};

/** PDF bucket — plan limitinde soru_havuzu kullanılır */
export function resolvePdfBucketId(): string {
  return resolveStorageBucket();
}

export function resolveImageBucketId(): string {
  return resolveStorageBucket() || APPWRITE_BUCKET_SORU_HAVUZU;
}

export async function uploadBlobToStorage(input: UploadBlobInput): Promise<UploadBlobResult> {
  const form = new FormData();
  const file = new File([input.blob], input.filename, {
    type: input.mimeType || input.blob.type || "application/octet-stream",
  });
  form.append("file", file);
  if (input.bucketId) form.append("bucketId", input.bucketId);

  const res = await fetch("/api/storage/upload", {
    method: "POST",
    body: form,
    credentials: "include",
  });

  const data = (await res.json().catch(() => ({}))) as {
    fileId?: string;
    bucketId?: string;
    error?: string;
  };

  if (!res.ok || !data.fileId || !data.bucketId) {
    throw new Error(data.error || "Dosya yüklenemedi");
  }

  return { fileId: data.fileId, bucketId: data.bucketId };
}

export async function fetchBlobFromStorage(
  bucketId: string,
  fileId: string
): Promise<Blob> {
  const params = new URLSearchParams({ bucketId, fileId });
  const res = await fetch(`/api/storage/file?${params}`, { credentials: "include" });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || "Dosya alınamadı");
  }
  return res.blob();
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Blob okunamadı"));
    reader.readAsDataURL(blob);
  });
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

export async function resolveCloudImageDataUrl(input: {
  dataUrl?: string;
  imageFileId?: string;
  imageBucketId?: string;
}): Promise<string> {
  if (input.dataUrl && !isCloudRef(input.dataUrl) && input.dataUrl.length > 0) {
    return input.dataUrl;
  }

  const fromDataUrl = input.dataUrl && isCloudRef(input.dataUrl) ? parseCloudRef(input.dataUrl) : null;
  const bucketId = input.imageBucketId || fromDataUrl?.bucketId;
  const fileId = input.imageFileId || fromDataUrl?.fileId;

  if (!bucketId || !fileId) return input.dataUrl || "";

  const blob = await fetchBlobFromStorage(bucketId, fileId);
  return blobToDataUrl(blob);
}
