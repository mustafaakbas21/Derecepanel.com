import "server-only";

import { Query } from "node-appwrite";

import {
  APPWRITE_COLLECTION_USERS,
  APPWRITE_DATABASE_ID,
} from "@/lib/appwrite/config";
import {
  ensureAppwriteAuthUser,
  resolveAuthEmailFromUsername,
} from "@/lib/appwrite/auth-users-server";
import { getAdminDatabases } from "@/lib/appwrite/server";
import { isAppwriteAuthReady } from "@/lib/auth/appwrite-login";
import { BUILTIN_ADMIN } from "@/lib/auth/local-auth";

export type ProvisionAdminResult = {
  appwriteUserId: string;
  email: string;
  username: string;
  adminId: string;
};

async function upsertAdminUserDoc(params: {
  appwriteUserId: string;
  email: string;
  username: string;
  adminId: string;
  displayName: string;
}): Promise<void> {
  const db = getAdminDatabases();
  const payload = {
    role: "admin",
    username: params.username,
    coachId: params.adminId,
    email: params.email,
    fullName: params.displayName,
  };

  try {
    const byUsername = await db.listDocuments(APPWRITE_DATABASE_ID, APPWRITE_COLLECTION_USERS, [
      Query.equal("username", params.username),
      Query.limit(1),
    ]);
    const doc = byUsername.documents[0];
    if (doc) {
      await db.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_COLLECTION_USERS,
        doc.$id,
        payload
      );
      return;
    }
  } catch {
    /* koleksiyon yoksa Auth kullanıcısı yine oluşur */
  }

  try {
    await db.createDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTION_USERS,
      params.appwriteUserId,
      payload
    );
  } catch (err) {
    const msg = String((err as Error)?.message || "").toLowerCase();
    if (/already exists|duplicate|409/i.test(msg)) {
      await db.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_COLLECTION_USERS,
        params.appwriteUserId,
        payload
      );
      return;
    }
    if (!/collection.*not found|could not be found/i.test(msg)) {
      throw err;
    }
  }
}

/** Kurucu admin1 hesabını Appwrite Auth + users koleksiyonuna yazar. */
export async function provisionAdminOnAppwrite(
  input: {
    username?: string;
    password?: string;
    displayName?: string;
    adminId?: string;
  } = {}
): Promise<ProvisionAdminResult> {
  if (!isAppwriteAuthReady()) {
    throw new Error("Appwrite sunucu yapılandırması eksik (APPWRITE_API_KEY).");
  }

  const username = input.username?.trim() || BUILTIN_ADMIN.username;
  const password = input.password || BUILTIN_ADMIN.password;
  const displayName = input.displayName?.trim() || BUILTIN_ADMIN.displayName;
  const adminId = input.adminId?.trim() || BUILTIN_ADMIN.id;

  const { userId: appwriteUserId, email } = await ensureAppwriteAuthUser({
    usernameOrEmail: username,
    password,
    displayName,
  });

  await upsertAdminUserDoc({
    appwriteUserId,
    email,
    username,
    adminId,
    displayName,
  });

  return {
    appwriteUserId,
    email,
    username,
    adminId,
  };
}

export function resolveAdminLoginEmail(username: string): string {
  return resolveAuthEmailFromUsername(username);
}
