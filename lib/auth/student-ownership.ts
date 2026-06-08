import "server-only";

import { Query } from "node-appwrite";

import {
  APPWRITE_COLLECTION_STUDENTS,
  APPWRITE_DATABASE_ID,
} from "@/lib/appwrite/config";
import { getAdminDatabases, isAppwriteServerConfigured } from "@/lib/appwrite/server";

/** Öğrencinin bağlı olduğu koç kimliği — Appwrite students koleksiyonu */
export async function getStudentCoachId(studentId: string): Promise<string | null> {
  const sid = studentId.trim();
  if (!sid || !isAppwriteServerConfigured()) return null;

  const db = getAdminDatabases();

  try {
    const doc = await db.getDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTION_STUDENTS,
      sid
    );
    return String(doc.coachId || doc.koc_id || "").trim() || null;
  } catch {
    /* document id eşleşmeyebilir — ogrenciId ile ara */
  }

  try {
    const result = await db.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTION_STUDENTS,
      [Query.equal("ogrenciId", sid), Query.limit(1)]
    );
    const doc = result.documents[0];
    if (!doc) return null;
    return String(doc.coachId || doc.koc_id || "").trim() || null;
  } catch {
    return null;
  }
}
