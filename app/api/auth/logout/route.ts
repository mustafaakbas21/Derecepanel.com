import { NextResponse } from "next/server";

import { logoutAppwriteSession } from "@/lib/auth/appwrite-login";
import {
  APPWRITE_USER_ID_COOKIE,
  AUTH_ROLE_COOKIE,
  AUTH_USER_ID_COOKIE,
  AUTH_USERNAME_COOKIE,
  readSessionSecret,
} from "@/lib/auth/session-server";
import { DP_SESSION_COOKIE } from "@/lib/auth/dp-session-token";
import { APPWRITE_SESSION_COOKIE } from "@/lib/appwrite/config";

export async function POST() {
  const sessionSecret = await readSessionSecret();
  await logoutAppwriteSession(sessionSecret);

  const response = NextResponse.json({ ok: true });
  const clear = { path: "/", maxAge: 0 };
  response.cookies.set(DP_SESSION_COOKIE, "", { ...clear, httpOnly: true });
  response.cookies.set(APPWRITE_SESSION_COOKIE, "", { ...clear, httpOnly: true });
  response.cookies.set(AUTH_ROLE_COOKIE, "", clear);
  response.cookies.set(AUTH_USER_ID_COOKIE, "", clear);
  response.cookies.set(APPWRITE_USER_ID_COOKIE, "", clear);
  response.cookies.set(AUTH_USERNAME_COOKIE, "", clear);
  return response;
}
