import "server-only";

import { ID, Query } from "node-appwrite";

import {
  APPWRITE_COLLECTION_USERS,
  APPWRITE_DATABASE_ID,
  resolveCoachLoginEmail,
} from "@/lib/appwrite/config";
import { getAdminDatabases, getAdminUsers } from "@/lib/appwrite/server";
import {
  isAppwriteAuthReady,
  provisionCoachAccount,
} from "@/lib/auth/appwrite-login";

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

async function findAppwriteUserIdByEmail(email: string): Promise<string | null> {
  try {
    const users = getAdminUsers();
    const page = await users.list([Query.equal("email", email), Query.limit(1)]);
    const user = page.users[0];
    return user?.$id ?? null;
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
  const existing = await db.listDocuments(APPWRITE_DATABASE_ID, APPWRITE_COLLECTION_USERS, [
    Query.equal("coachId", params.coachId),
    Query.limit(1),
  ]);

  const payload = {
    role: "coach",
    username: params.username,
    coachId: params.coachId,
    email: params.email,
    fullName: params.displayName,
  };

  const doc = existing.documents[0];
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
  const email = resolveCoachLoginEmail(input.username);
  if (!email) {
    throw new Error("Geçersiz kullanıcı adı.");
  }

  if (!isAppwriteAuthReady()) {
    return { email, appwriteProvisioned: false };
  }

  await provisionCoachAccount(email, input.password);

  let appwriteUserId = await findAppwriteUserIdByEmail(email);
  if (!appwriteUserId) {
    const name = input.displayName.trim() || input.username;
    const created = await getAdminUsers().create(
      ID.unique(),
      email,
      undefined,
      input.password,
      name
    );
    appwriteUserId = created.$id;
  }

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
