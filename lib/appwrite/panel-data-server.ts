import "server-only";

import { ID, Query } from "node-appwrite";

import {
  APPWRITE_COLLECTION_PANEL_DATA,
  APPWRITE_DATABASE_ID,
} from "@/lib/appwrite/config";
import { getAdminDatabases } from "@/lib/appwrite/server";

type PanelDoc = {
  $id: string;
  ownerId: string;
  dataKey: string;
  payload: string;
  [key: string]: unknown;
};

export async function listPanelDataForOwner(
  ownerId: string
): Promise<Record<string, string>> {
  const db = getAdminDatabases();
  const items: Record<string, string> = {};
  let cursor: string | undefined;

  do {
    const queries = [Query.equal("ownerId", ownerId), Query.limit(100)];
    if (cursor) queries.push(Query.cursorAfter(cursor));

    const page = await db.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTION_PANEL_DATA,
      queries
    );

    for (const doc of page.documents) {
      items[String(doc.dataKey)] = String(doc.payload ?? "");
    }

    if (page.documents.length < 100) break;
    cursor = page.documents[page.documents.length - 1]?.$id;
  } while (cursor);

  return items;
}

export async function getPanelDataEntry(
  ownerId: string,
  dataKey: string
): Promise<string | null> {
  const db = getAdminDatabases();
  const result = await db.listDocuments(
    APPWRITE_DATABASE_ID,
    APPWRITE_COLLECTION_PANEL_DATA,
    [Query.equal("ownerId", ownerId), Query.equal("dataKey", dataKey), Query.limit(1)]
  );
  const doc = result.documents[0];
  return doc ? String(doc.payload ?? "") : null;
}

export async function setPanelDataEntry(
  ownerId: string,
  dataKey: string,
  payload: string
): Promise<void> {
  const db = getAdminDatabases();
  const existing = await db.listDocuments(
    APPWRITE_DATABASE_ID,
    APPWRITE_COLLECTION_PANEL_DATA,
    [Query.equal("ownerId", ownerId), Query.equal("dataKey", dataKey), Query.limit(1)]
  );

  const doc = existing.documents[0];
  if (doc) {
    await db.updateDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTION_PANEL_DATA,
      doc.$id,
      { payload }
    );
    return;
  }

  await db.createDocument(
    APPWRITE_DATABASE_ID,
    APPWRITE_COLLECTION_PANEL_DATA,
    ID.unique(),
    { ownerId, dataKey, payload }
  );
}

export async function deletePanelDataEntry(
  ownerId: string,
  dataKey: string
): Promise<void> {
  const db = getAdminDatabases();
  const existing = await db.listDocuments(
    APPWRITE_DATABASE_ID,
    APPWRITE_COLLECTION_PANEL_DATA,
    [Query.equal("ownerId", ownerId), Query.equal("dataKey", dataKey), Query.limit(1)]
  );
  const doc = existing.documents[0];
  if (!doc) return;
  await db.deleteDocument(APPWRITE_DATABASE_ID, APPWRITE_COLLECTION_PANEL_DATA, doc.$id);
}
