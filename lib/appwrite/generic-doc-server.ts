import "server-only";

import { ID, Query } from "node-appwrite";

import { APPWRITE_DATABASE_ID } from "@/lib/appwrite/config";
import { getAdminDatabases, isAppwriteServerConfigured } from "@/lib/appwrite/server";

export type GenericDocInput = {
  coachId: string;
  ownerId?: string;
  entityId: string;
  examId?: string;
  payload: string;
};

export function genericDocId(coachId: string, entityId: string): string {
  const raw = `${coachId}_${entityId}`.replace(/[^a-zA-Z0-9_-]/g, "_");
  return raw.slice(0, 36) || ID.unique();
}

export async function upsertGenericDoc(
  collectionId: string,
  input: GenericDocInput
): Promise<string> {
  if (!isAppwriteServerConfigured()) {
    throw new Error("Appwrite yapılandırması eksik.");
  }

  const db = getAdminDatabases();
  const docId = genericDocId(input.coachId, input.entityId);
  const body = {
    coachId: input.coachId,
    ownerId: input.ownerId || input.coachId,
    entityId: input.entityId,
    examId: input.examId || "",
    payload: input.payload,
  };

  try {
    await db.getDocument(APPWRITE_DATABASE_ID, collectionId, docId);
    await db.updateDocument(APPWRITE_DATABASE_ID, collectionId, docId, body);
  } catch (err) {
    const msg = String((err as Error)?.message || "").toLowerCase();
    if (/not found|could not be found|404/.test(msg)) {
      await db.createDocument(APPWRITE_DATABASE_ID, collectionId, docId, body);
    } else {
      throw err;
    }
  }

  return docId;
}

export async function getGenericDocPayload(
  collectionId: string,
  coachId: string,
  entityId: string
): Promise<string | null> {
  if (!isAppwriteServerConfigured()) return null;

  const db = getAdminDatabases();
  const docId = genericDocId(coachId, entityId);
  try {
    const doc = await db.getDocument(APPWRITE_DATABASE_ID, collectionId, docId);
    return String((doc as { payload?: string }).payload ?? "");
  } catch {
    return null;
  }
}

export async function listGenericDocPayloads(
  collectionId: string,
  coachId: string,
  limit = 500
): Promise<Array<{ entityId: string; payload: string }>> {
  if (!isAppwriteServerConfigured()) return [];

  const db = getAdminDatabases();
  const result = await db.listDocuments(APPWRITE_DATABASE_ID, collectionId, [
    Query.equal("coachId", coachId),
    Query.limit(limit),
  ]);

  return result.documents.map((raw) => {
    const d = raw as { entityId?: string; payload?: string };
    return {
      entityId: String(d.entityId || ""),
      payload: String(d.payload || ""),
    };
  });
}

export async function deleteGenericDoc(
  collectionId: string,
  coachId: string,
  entityId: string
): Promise<void> {
  if (!isAppwriteServerConfigured()) return;

  const db = getAdminDatabases();
  const docId = genericDocId(coachId, entityId);
  try {
    await db.deleteDocument(APPWRITE_DATABASE_ID, collectionId, docId);
  } catch {
    /* ignore */
  }
}
