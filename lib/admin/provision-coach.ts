import "server-only";

import {
  APPWRITE_COLLECTION_USERS,
  APPWRITE_DATABASE_ID,
} from "@/lib/appwrite/config";
import { getAdminDatabases } from "@/lib/appwrite/server";
import {
  ensureAppwriteAuthUser,
  resolveAuthEmailFromUsername,
} from "@/lib/appwrite/auth-users-server";
import { isAppwriteAuthReady } from "@/lib/auth/appwrite-login";
import { Query } from "node-appwrite";

export type ProvisionCoachInput = {
  username: string;
  password: string;
  displayName: string;
  coachId: string;
};

export type ProvisionCoachResult = {
  email: string;
  appwriteProvisioned: boolean;
  appwriteUserId?: string;
};

async function findCoachUserDoc(params: {
  coachId: string;
  email: string;
  username: string;
  appwriteUserId: string;
}) {
  const db = getAdminDatabases();

  const byCoachId = await db.listDocuments(APPWRITE_DATABASE_ID, APPWRITE_COLLECTION_USERS, [
    Query.equal("coachId", params.coachId),
    Query.limit(1),
  ]);
  if (byCoachId.documents[0]) return byCoachId.documents[0];

  const byEmail = await db.listDocuments(APPWRITE_DATABASE_ID, APPWRITE_COLLECTION_USERS, [
    Query.equal("email", params.email),
    Query.limit(1),
  ]);
  if (byEmail.documents[0]) return byEmail.documents[0];

  const byUsername = await db.listDocuments(APPWRITE_DATABASE_ID, APPWRITE_COLLECTION_USERS, [
    Query.equal("username", params.username),
    Query.limit(1),
  ]);
  if (byUsername.documents[0]) return byUsername.documents[0];

  try {
    return await db.getDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTION_USERS,
      params.appwriteUserId
    );
  } catch {
    return null;
  }
}

async function upsertCoachUserDoc(params: {
  appwriteUserId: string;
  email: string;
  username: string;
  coachId: string;
  displayName: string;
}): Promise<void> {
  const db = getAdminDatabases();

  const payload = {
    role: "coach",
    username: params.username,
    coachId: params.coachId,
    email: params.email,
    fullName: params.displayName,
  };

  const doc = await findCoachUserDoc(params);
  if (doc) {
    await db.updateDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTION_USERS,
      doc.$id,
      payload
    );
    return;
  }

  await db.createDocument(
    APPWRITE_DATABASE_ID,
    APPWRITE_COLLECTION_USERS,
    params.appwriteUserId,
    payload
  );
}

export async function provisionCoachWithAppwrite(
  input: ProvisionCoachInput
): Promise<ProvisionCoachResult> {
  if (!isAppwriteAuthReady()) {
    const email = resolveAuthEmailFromUsername(input.username);
    return { email, appwriteProvisioned: false };
  }

  const { userId: appwriteUserId, email } = await ensureAppwriteAuthUser({
    usernameOrEmail: input.username,
    password: input.password,
    displayName: input.displayName,
  });

  try {
    await upsertCoachUserDoc({
      appwriteUserId,
      email,
      username: input.username.trim(),
      coachId: input.coachId,
      displayName: input.displayName.trim() || input.username.trim(),
    });
  } catch (err) {
    const msg = String((err as Error)?.message || "").toLowerCase();
    if (!/collection.*not found|could not be found/i.test(msg)) {
      throw err;
    }
  }

  return {
    email,
    appwriteProvisioned: true,
    appwriteUserId,
  };
}
