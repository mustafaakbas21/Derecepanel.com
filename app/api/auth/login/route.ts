import { NextResponse } from "next/server";

import { loginWithAppwrite, isAppwriteAuthReady } from "@/lib/auth/appwrite-login";
import {
  BUILTIN_ADMIN,
  buildBuiltinAdminSessionSecret,
  builtinAdminSessionAllowed,
  isBuiltinAdminCredentials,
} from "@/lib/auth/builtin-admin";
import { signDpSession, DP_SESSION_COOKIE } from "@/lib/auth/dp-session-token";
import {
  APPWRITE_USER_ID_COOKIE,
  AUTH_ROLE_COOKIE,
  AUTH_USER_ID_COOKIE,
  AUTH_USERNAME_COOKIE,
} from "@/lib/auth/session-server";
import { MAINTENANCE_BLOCK_MESSAGE } from "@/lib/admin/maintenance";
import { isMaintenanceModeServer } from "@/lib/admin/maintenance-server";
import { APPWRITE_SESSION_COOKIE } from "@/lib/appwrite/config";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function setAuthCookies(
  response: NextResponse,
  data: {
    sessionSecret: string;
    userId: string;
    role: "coach" | "student" | "admin";
    email: string;
    username?: string;
  }
) {
  const base = { path: "/", maxAge: COOKIE_MAX_AGE, sameSite: "lax" as const };
  const httpOnlyBase = {
    ...base,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  response.cookies.set(
    DP_SESSION_COOKIE,
    signDpSession({
      userId: data.userId,
      role: data.role,
      email: data.email,
      username: data.username,
    }),
    httpOnlyBase
  );
  response.cookies.set(APPWRITE_SESSION_COOKIE, data.sessionSecret, httpOnlyBase);
  response.cookies.set(AUTH_ROLE_COOKIE, data.role, base);
  response.cookies.set(AUTH_USER_ID_COOKIE, data.userId, base);
  response.cookies.set(APPWRITE_USER_ID_COOKIE, data.userId, base);
  if (data.username) {
    response.cookies.set(AUTH_USERNAME_COOKIE, data.username, base);
  }
}

export async function POST(request: Request) {
  let body: { role?: string; username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const role = body.role;
  const username = String(body.username || "").trim();
  const password = String(body.password || "");
  if (!username || !password) {
    return NextResponse.json({ error: "Geçersiz kullanıcı adı veya şifre" }, { status: 401 });
  }
  if (role !== "coach" && role !== "student" && role !== "admin") {
    return NextResponse.json({ error: "Geçersiz rol." }, { status: 400 });
  }

  if ((role === "coach" || role === "student") && (await isMaintenanceModeServer())) {
    return NextResponse.json({ error: MAINTENANCE_BLOCK_MESSAGE }, { status: 503 });
  }

  if (
    role === "admin" &&
    builtinAdminSessionAllowed() &&
    isBuiltinAdminCredentials(username, password)
  ) {
    const response = NextResponse.json({
      ok: true,
      role: "admin",
      userId: BUILTIN_ADMIN.id,
      email: `${BUILTIN_ADMIN.username}@local`,
      username: BUILTIN_ADMIN.username,
      student: null,
    });
    setAuthCookies(response, {
      sessionSecret: buildBuiltinAdminSessionSecret(),
      userId: BUILTIN_ADMIN.id,
      role: "admin",
      email: `${BUILTIN_ADMIN.username}@local`,
      username: BUILTIN_ADMIN.username,
    });
    return response;
  }

  if (!isAppwriteAuthReady()) {
    return NextResponse.json(
      {
        error:
          "Appwrite yapılandırılmadı. APPWRITE_API_KEY ve NEXT_PUBLIC_APPWRITE_* değişkenlerini tanımlayın.",
      },
      { status: 503 }
    );
  }

  try {
    const result = await loginWithAppwrite({ role, username, password });
    const response = NextResponse.json({
      ok: true,
      role: result.role,
      userId: result.userId,
      email: result.email,
      username: result.username,
      student: result.student ?? null,
    });
    setAuthCookies(response, {
      sessionSecret: result.sessionSecret,
      userId: result.userId,
      role: result.role,
      email: result.email,
      username: result.username,
    });
    return response;
  } catch (err) {
    const msg = String((err as Error)?.message || "Geçersiz kullanıcı adı veya şifre");
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}
