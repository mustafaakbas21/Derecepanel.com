import "server-only";

import { ID, Query } from "node-appwrite";

import {
  APPWRITE_COLLECTION_SORU_HAVUZU,
  APPWRITE_DATABASE_ID,
} from "@/lib/appwrite/config";
import { getAdminDatabases, isAppwriteServerConfigured } from "@/lib/appwrite/server";

export type SoruHavuzuMetaDoc = {
  coachId: string;
  ownerId: string;
  entityId: string;
  examId?: string;
  payload: string;
};

export async function upsertSoruHavuzuMeta(doc: SoruHavuzuMetaDoc): Promise<void> {
  if (!isAppwriteServerConfigured()) return;

  const db = getAdminDatabases();
  const docId = `${doc.coachId}_${doc.entityId}`.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 36);

  const payload = {
    coachId: doc.coachId,
    ownerId: doc.ownerId,
    entityId: doc.entityId,
    examId: doc.examId ?? "",
    payload: doc.payload,
  };

  try {
    await db.getDocument(APPWRITE_DATABASE_ID, APPWRITE_COLLECTION_SORU_HAVUZU, docId);
    await db.updateDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTION_SORU_HAVUZU,
      docId,
      payload
    );
  } catch (err) {
    const msg = String((err as Error)?.message || "").toLowerCase();
    if (/not found|could not be found|404/.test(msg)) {
      await db.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_COLLECTION_SORU_HAVUZU,
        docId || ID.unique(),
        payload
      );
      return;
    }
    throw err;
  }
}

export async function listSoruHavuzuMetaForCoach(coachId: string): Promise<SoruHavuzuMetaDoc[]> {
  if (!isAppwriteServerConfigured()) return [];

  const db = getAdminDatabases();
  const result = await db.listDocuments(APPWRITE_DATABASE_ID, APPWRITE_COLLECTION_SORU_HAVUZU, [
    Query.equal("coachId", coachId),
    Query.limit(500),
  ]);

  return result.documents.map((raw) => {
    const d = raw as Record<string, unknown>;
    return {
      coachId: String(d.coachId || ""),
      ownerId: String(d.ownerId || ""),
      entityId: String(d.entityId || ""),
      examId: String(d.examId || ""),
      payload: String(d.payload || ""),
    };
  });
}
