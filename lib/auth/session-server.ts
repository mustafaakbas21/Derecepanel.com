import "server-only";

import { cookies } from "next/headers";

import { BUILTIN_ADMIN, isBuiltinAdminSession } from "@/lib/auth/builtin-admin";
import {
  APPWRITE_USER_ID_COOKIE,
  AUTH_ROLE_COOKIE,
  AUTH_USER_ID_COOKIE,
  AUTH_USERNAME_COOKIE,
  DP_SESSION_COOKIE,
} from "@/lib/auth/cookie-names";
import { verifyDpSession } from "@/lib/auth/dp-session-token";
import { APPWRITE_SESSION_COOKIE } from "@/lib/appwrite/config";
import { getSessionAccount } from "@/lib/appwrite/server";

export {
  APPWRITE_USER_ID_COOKIE,
  AUTH_ROLE_COOKIE,
  AUTH_USER_ID_COOKIE,
  AUTH_USERNAME_COOKIE,
  DP_SESSION_COOKIE,
};

export type ServerAuthSession = {
  userId: string;
  role: "coach" | "student" | "admin";
  email: string;
  username?: string;
  sessionSecret: string;
};

export async function readSessionSecret(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(APPWRITE_SESSION_COOKIE)?.value?.trim() || null;
}

export async function readAuthRole(): Promise<ServerAuthSession["role"] | null> {
  const jar = await cookies();
  const role = jar.get(AUTH_ROLE_COOKIE)?.value?.trim();
  if (role === "coach" || role === "student" || role === "admin") return role;
  return null;
}

export async function readAuthUserId(): Promise<string | null> {
  const jar = await cookies();
  return (
    jar.get(AUTH_USER_ID_COOKIE)?.value?.trim() ||
    jar.get(APPWRITE_USER_ID_COOKIE)?.value?.trim() ||
    null
  );
}

export async function getServerAuthSession(): Promise<ServerAuthSession | null> {
  const jar = await cookies();
  const signed = verifyDpSession(jar.get(DP_SESSION_COOKIE)?.value);
  const sessionSecret = await readSessionSecret();

  if (signed) {
    return {
      userId: signed.userId,
      role: signed.role,
      email: signed.email,
      username: signed.username,
      sessionSecret: sessionSecret || signed.userId,
    };
  }

  const role = await readAuthRole();
  const userId = await readAuthUserId();
  if (!sessionSecret || !role || !userId) return null;

  if (isBuiltinAdminSession(sessionSecret)) {
    const username = jar.get(AUTH_USERNAME_COOKIE)?.value?.trim() || BUILTIN_ADMIN.username;
    return {
      userId,
      role: "admin",
      email: `${username}@local`,
      username,
      sessionSecret,
    };
  }

  const username = jar.get(AUTH_USERNAME_COOKIE)?.value?.trim();

  try {
    const account = getSessionAccount(sessionSecret);
    const user = await account.get();
    return {
      userId,
      role,
      email: String(user.email || ""),
      username: username || undefined,
      sessionSecret,
    };
  } catch {
    return null;
  }
}
