import "server-only";

import { ID, Permission, Role } from "node-appwrite";
import { InputFile } from "node-appwrite/file";

import {
  APPWRITE_BUCKET_DENEME_DEPOSU,
  APPWRITE_BUCKET_SORU_HAVUZU,
} from "@/lib/appwrite/config";
import { getAdminStorage, isAppwriteServerConfigured } from "@/lib/appwrite/server";

export type AppwriteBucketId =
  | typeof APPWRITE_BUCKET_SORU_HAVUZU
  | typeof APPWRITE_BUCKET_DENEME_DEPOSU
  | string;

const USER_FILE_PERMS = [
  Permission.read(Role.users()),
  Permission.update(Role.users()),
  Permission.delete(Role.users()),
];

export function isAppwriteStorageConfigured(): boolean {
  return isAppwriteServerConfigured();
}

export async function uploadBufferToBucket(input: {
  bucketId: AppwriteBucketId;
  buffer: Buffer | Uint8Array;
  filename: string;
  fileId?: string;
  mimeType?: string;
}): Promise<{ fileId: string; bucketId: string }> {
  if (!isAppwriteStorageConfigured()) {
    throw new Error("Appwrite storage yapılandırması eksik.");
  }

  const storage = getAdminStorage();
  const fileId = input.fileId || ID.unique();
  const file = InputFile.fromBuffer(Buffer.from(input.buffer), input.filename);

  const created = await storage.createFile({
    bucketId: input.bucketId,
    fileId,
    file,
    permissions: USER_FILE_PERMS,
  });

  return { fileId: created.$id, bucketId: input.bucketId };
}

export async function deleteBucketFile(bucketId: AppwriteBucketId, fileId: string): Promise<void> {
  if (!isAppwriteStorageConfigured()) return;
  const storage = getAdminStorage();
  await storage.deleteFile({ bucketId, fileId });
}

export async function getBucketFileMeta(bucketId: AppwriteBucketId, fileId: string) {
  if (!isAppwriteStorageConfigured()) {
    throw new Error("Appwrite storage yapılandırması eksik.");
  }
  const storage = getAdminStorage();
  return storage.getFile({ bucketId, fileId });
}
