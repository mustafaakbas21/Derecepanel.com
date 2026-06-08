import { NextResponse } from "next/server";

import {
  isAppwriteAuthReady,
  isAdminPanelUsername,
  loginCoachWithUsernameOnly,
  loginWithAppwrite,
} from "@/lib/auth/appwrite-login";
import { normalizeLoginUsername } from "@/lib/appwrite/config";
import {
  BUILTIN_ADMIN,
  buildBuiltinAdminSessionSecret,
  builtinAdminSessionAllowed,
  isBuiltinAdminCredentials,
} from "@/lib/auth/builtin-admin";
import { signDpSession, DP_SESSION_COOKIE } from "@/lib/auth/dp-session-token";
import { resolveRequestHost } from "@/lib/auth/request-host";
import {
  APPWRITE_USER_ID_COOKIE,
  AUTH_ROLE_COOKIE,
  AUTH_USER_ID_COOKIE,
  AUTH_USERNAME_COOKIE,
} from "@/lib/auth/session-server";
import { MAINTENANCE_BLOCK_MESSAGE } from "@/lib/admin/maintenance";
import { isMaintenanceModeServer } from "@/lib/admin/maintenance-server";
import { APPWRITE_SESSION_COOKIE } from "@/lib/appwrite/config";
import { enforceRateLimit } from "@/lib/security/apply-rate-limit";

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
  const domain =
    process.env.NODE_ENV === "production" ? { domain: ".derecepanel.com" as const } : {};

  const signed = signDpSession({
    userId: data.userId,
    role: data.role,
    email: data.email,
    username: data.username,
  });

  response.cookies.set(DP_SESSION_COOKIE, signed, { ...httpOnlyBase, ...domain });
  response.cookies.set(APPWRITE_SESSION_COOKIE, data.sessionSecret, { ...httpOnlyBase, ...domain });
  response.cookies.set(AUTH_ROLE_COOKIE, data.role, { ...base, ...domain });
  response.cookies.set(AUTH_USER_ID_COOKIE, data.userId, { ...base, ...domain });
  response.cookies.set(APPWRITE_USER_ID_COOKIE, data.userId, { ...base, ...domain });
  if (data.username) {
    response.cookies.set(AUTH_USERNAME_COOKIE, data.username, { ...base, ...domain });
  }
}

function buildBuiltinAdminLoginResponse(): NextResponse {
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

export async function POST(request: Request) {
  try {
    const rateLimited = await enforceRateLimit(request, "auth-login", 10, 60);
    if (rateLimited) return rateLimited;

    let body: { role?: string; username?: string; password?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
    }

    const role = body.role;
    const username = String(body.username || "").trim();
    const password = String(body.password || "");
    const host = resolveRequestHost(request);
    const loginUsername = normalizeLoginUsername(username) || username;

    if (!username) {
      return NextResponse.json({ error: "Kullanıcı adınızı girin." }, { status: 401 });
    }
    if (role === "admin" && !password) {
      const allowPasswordlessAdmin =
        isBuiltinAdminCredentials(loginUsername, password) ||
        (builtinAdminSessionAllowed(host) && (await isAdminPanelUsername(loginUsername)));
      if (!allowPasswordlessAdmin) {
        return NextResponse.json({ error: "Geçersiz kullanıcı adı veya şifre" }, { status: 401 });
      }
    }
    if (role === "student" && !password) {
      return NextResponse.json({ error: "Geçersiz kullanıcı adı veya şifre" }, { status: 401 });
    }
    if (role === "coach" && !password) {
      return NextResponse.json({ error: "Geçersiz kullanıcı adı veya şifre" }, { status: 401 });
    }
    if (role !== "coach" && role !== "student" && role !== "admin") {
      return NextResponse.json({ error: "Geçersiz rol." }, { status: 400 });
    }

    if ((role === "coach" || role === "student") && (await isMaintenanceModeServer())) {
      return NextResponse.json({ error: MAINTENANCE_BLOCK_MESSAGE }, { status: 503 });
    }

    // Kurucu yerleşik hesap — host bağımsız (şifre korumalı)
    if (role === "admin" && isBuiltinAdminCredentials(loginUsername, password)) {
      return buildBuiltinAdminLoginResponse();
    }

    if (role === "admin" && isAppwriteAuthReady()) {
      try {
        const result = await loginWithAppwrite({
          role: "admin",
          username: loginUsername,
          password,
        });
        const response = NextResponse.json({
          ok: true,
          role: result.role,
          userId: result.userId,
          email: result.email,
          username: result.username,
          student: null,
        });
        setAuthCookies(response, {
          sessionSecret: result.sessionSecret,
          userId: result.userId,
          role: "admin",
          email: result.email,
          username: result.username,
        });
        return response;
      } catch {
        /* Appwrite admin yoksa devam */
      }

      if (!password && builtinAdminSessionAllowed(host)) {
        try {
          if (!(await isAdminPanelUsername(loginUsername))) {
            return NextResponse.json(
              { error: "Geçersiz kullanıcı adı veya şifre" },
              { status: 401 }
            );
          }
          const result = await loginCoachWithUsernameOnly(loginUsername);
          const response = NextResponse.json({
            ok: true,
            role: "admin",
            userId: result.userId,
            email: result.email,
            username: result.username,
            student: null,
          });
          setAuthCookies(response, {
            sessionSecret: result.sessionSecret,
            userId: result.userId,
            role: "admin",
            email: result.email,
            username: result.username,
          });
          return response;
        } catch {
          /* devam */
        }
      }
    }

    if (!isAppwriteAuthReady()) {
      if (role === "admin") {
        return NextResponse.json(
          { error: "Geçersiz kullanıcı adı veya şifre" },
          { status: 401 }
        );
      }
      return NextResponse.json(
        {
          error:
            "Appwrite yapılandırılmadı. APPWRITE_API_KEY ve NEXT_PUBLIC_APPWRITE_* değişkenlerini tanımlayın.",
        },
        { status: 503 }
      );
    }

    const result = await loginWithAppwrite({ role, username: loginUsername, password });

    const sessionRole =
      role === "admin" ? result.role : (role as "coach" | "student");

    const response = NextResponse.json({
      ok: true,
      role: sessionRole,
      userId: result.userId,
      email: result.email,
      username: result.username,
      student: result.student ?? null,
    });
    setAuthCookies(response, {
      sessionSecret: result.sessionSecret,
      userId: result.userId,
      role: sessionRole,
      email: result.email,
      username: result.username,
    });
    return response;
  } catch (err) {
    const msg = String((err as Error)?.message || "Giriş işlemi başarısız");
    if (/geçersiz|oturum|kullanıcı|şifre en az/i.test(msg)) {
      return NextResponse.json({ error: msg }, { status: 401 });
    }
    console.error("[auth/login]", err);
    return NextResponse.json(
      { error: "Giriş işlemi başarısız. Lütfen tekrar deneyin." },
      { status: 500 }
    );
  }
}
