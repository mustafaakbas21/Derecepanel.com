import "server-only";

import { ID } from "node-appwrite";

import {
  APPWRITE_BUCKET_SORU_HAVUZU,
  APPWRITE_COLLECTION_ARCHIVES,
  resolveStorageBucket,
} from "@/lib/appwrite/config";
import {
  deleteGenericDoc,
  getGenericDocPayload,
  listGenericDocPayloads,
  upsertGenericDoc,
} from "@/lib/appwrite/generic-doc-server";
import { deleteBucketFile, uploadBufferToBucket } from "@/lib/appwrite/storage-server";

export type ArchiveScope =
  | "fmt"
  | "pdf_deposu"
  | "tarama"
  | "recete"
  | "question_pool";

function entityId(scope: ArchiveScope, id: string): string {
  return `${scope}:${id}`;
}

export function parseArchiveEntityId(
  entityId: string
): { scope: ArchiveScope; id: string } | null {
  const sep = entityId.indexOf(":");
  if (sep < 1) return null;
  const scope = entityId.slice(0, sep) as ArchiveScope;
  const id = entityId.slice(sep + 1);
  if (!id || !["fmt", "pdf_deposu", "tarama", "recete", "question_pool"].includes(scope)) {
    return null;
  }
  return { scope, id };
}

export type ArchiveRecord = {
  id: string;
  scope: ArchiveScope;
  payload: string;
  fileId?: string;
  bucketId?: string;
};

export async function archivePut(input: {
  coachId: string;
  scope: ArchiveScope;
  id: string;
  payload: string;
  fileBuffer?: Buffer;
  filename?: string;
  mimeType?: string;
}): Promise<ArchiveRecord> {
  let fileId: string | undefined;
  let bucketId: string | undefined;

  const existing = await archiveGet(input.coachId, input.scope, input.id);

  if (input.fileBuffer && input.fileBuffer.length > 0) {
    bucketId = resolveStorageBucket();
    const uploaded = await uploadBufferToBucket({
      bucketId,
      buffer: input.fileBuffer,
      filename: input.filename || `${input.scope}-${input.id}`,
      mimeType: input.mimeType,
    });
    fileId = uploaded.fileId;
    bucketId = uploaded.bucketId;
  } else if (existing?.fileId) {
    fileId = existing.fileId;
    bucketId = existing.bucketId;
  }

  const meta = JSON.stringify({
    payload: input.payload,
    fileId: fileId || "",
    bucketId: bucketId || "",
    updatedAt: Date.now(),
  });

  await upsertGenericDoc(APPWRITE_COLLECTION_ARCHIVES, {
    coachId: input.coachId,
    ownerId: input.coachId,
    entityId: entityId(input.scope, input.id),
    payload: meta,
  });

  return {
    id: input.id,
    scope: input.scope,
    payload: input.payload,
    fileId,
    bucketId,
  };
}

export async function archiveGet(
  coachId: string,
  scope: ArchiveScope,
  id: string
): Promise<ArchiveRecord | null> {
  const raw = await getGenericDocPayload(
    APPWRITE_COLLECTION_ARCHIVES,
    coachId,
    entityId(scope, id)
  );
  if (!raw) return null;

  try {
    const meta = JSON.parse(raw) as {
      payload?: string;
      fileId?: string;
      bucketId?: string;
    };
    return {
      id,
      scope,
      payload: String(meta.payload ?? ""),
      fileId: meta.fileId || undefined,
      bucketId: meta.bucketId || APPWRITE_BUCKET_SORU_HAVUZU,
    };
  } catch {
    return { id, scope, payload: raw };
  }
}

export async function archiveList(
  coachId: string,
  scope: ArchiveScope
): Promise<ArchiveRecord[]> {
  const prefix = `${scope}:`;
  const docs = await listGenericDocPayloads(APPWRITE_COLLECTION_ARCHIVES, coachId, 1000);
  const out: ArchiveRecord[] = [];

  for (const doc of docs) {
    if (!doc.entityId.startsWith(prefix)) continue;
    const id = doc.entityId.slice(prefix.length);
    if (!id) continue;

    try {
      const meta = JSON.parse(doc.payload) as {
        payload?: string;
        fileId?: string;
        bucketId?: string;
      };
      out.push({
        id,
        scope,
        payload: String(meta.payload ?? ""),
        fileId: meta.fileId || undefined,
        bucketId: meta.bucketId || APPWRITE_BUCKET_SORU_HAVUZU,
      });
    } catch {
      out.push({ id, scope, payload: doc.payload });
    }
  }

  return out;
}

export async function archiveDelete(
  coachId: string,
  scope: ArchiveScope,
  id: string
): Promise<void> {
  const existing = await archiveGet(coachId, scope, id);
  if (existing?.fileId && existing.bucketId) {
    try {
      await deleteBucketFile(existing.bucketId, existing.fileId);
    } catch {
      /* ignore */
    }
  }
  await deleteGenericDoc(
    APPWRITE_COLLECTION_ARCHIVES,
    coachId,
    entityId(scope, id)
  );
}

export function newArchiveId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${ID.unique().slice(0, 6)}`;
}
