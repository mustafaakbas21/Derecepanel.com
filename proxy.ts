import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  ADMIN_UNLOCK_COOKIE,
  canAccessAdminRoutes,
  isAdminHost,
  isAdminOnlyServer,
  resolveAdminSubdomainRewritePath,
} from "@/lib/admin/admin-portal";
import { isMaintenanceModeServer } from "@/lib/admin/maintenance-server";
import { APPWRITE_SESSION_COOKIE } from "@/lib/appwrite/config";
import { AUTH_ROLE_COOKIE, DP_SESSION_COOKIE } from "@/lib/auth/cookie-names";

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

/** Kurucu girişi — dp_admin_unlock olmadan da erişilebilir */
function isPublicAdminPath(pathname: string): boolean {
  return pathname === "/admin/giris";
}

function isKurucuUnlockPath(pathname: string): boolean {
  return pathname === "/kurucu";
}

function hasPanelSession(request: NextRequest): boolean {
  const dpSession = request.cookies.get(DP_SESSION_COOKIE)?.value?.trim();
  const appwriteSession = request.cookies.get(APPWRITE_SESSION_COOKIE)?.value?.trim();
  return Boolean(dpSession || appwriteSession);
}

function isCoachPanelPath(pathname: string): boolean {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

function isStudentPanelPath(pathname: string): boolean {
  return pathname === "/ogrenci" || pathname.startsWith("/ogrenci/");
}

function isStaticOrApi(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    /\.[a-z0-9]+$/i.test(pathname)
  );
}

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const { pathname } = url;
  const host = request.headers.get("host") ?? "";

  if (isStaticOrApi(pathname) || isKurucuUnlockPath(pathname)) {
    return NextResponse.next();
  }

  if (isAdminHost(host)) {
    if (isCoachPanelPath(pathname) || isStudentPanelPath(pathname)) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    const rewritePath = resolveAdminSubdomainRewritePath(pathname);
    if (rewritePath) {
      url.pathname = rewritePath;
      return NextResponse.rewrite(url);
    }
  }

  const routingPathname = pathname;

  let maintenance = false;
  try {
    maintenance = await isMaintenanceModeServer();
  } catch {
    maintenance = false;
  }
  if (maintenance) {
    const role = request.cookies.get(AUTH_ROLE_COOKIE)?.value;
    if (role !== "admin") {
      const isGiris = routingPathname === "/giris";
      const isPanel =
        routingPathname.startsWith("/dashboard") ||
        routingPathname.startsWith("/ogrenci");

      if (isGiris) {
        const url = request.nextUrl.clone();
        url.searchParams.set("bakim", "1");
        if (!request.nextUrl.searchParams.has("bakim")) {
          return NextResponse.redirect(url);
        }
      } else if (isPanel) {
        return NextResponse.redirect(new URL("/giris?bakim=1", request.url));
      }
    }
  }

  const unlockCookie = request.cookies.get(ADMIN_UNLOCK_COOKIE)?.value;
  const adminAccess = canAccessAdminRoutes({ host, unlockCookie });
  const adminOnly = isAdminOnlyServer();

  if (adminOnly) {
    if (routingPathname === "/") {
      return NextResponse.redirect(new URL("/admin/giris", request.url));
    }

    const isPanelLoginOrApp =
      routingPathname === "/giris" ||
      isCoachPanelPath(routingPathname) ||
      isStudentPanelPath(routingPathname);

    if (!isAdminPath(routingPathname) && !isPanelLoginOrApp) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    return NextResponse.next();
  }

  if (isAdminPath(routingPathname) && !adminAccess && !isPublicAdminPath(routingPathname)) {
    const authRole = request.cookies.get(AUTH_ROLE_COOKIE)?.value?.trim();
    const hasAdminSession =
      authRole === "admin" && Boolean(request.cookies.get(DP_SESSION_COOKIE)?.value);
    if (!hasAdminSession) {
      const loginUrl = isAdminHost(host)
        ? new URL("/giris", request.url)
        : new URL("/", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (isCoachPanelPath(routingPathname)) {
    if (!hasPanelSession(request)) {
      return NextResponse.redirect(new URL("/giris", request.url));
    }
    const role = request.cookies.get(AUTH_ROLE_COOKIE)?.value?.trim();
    if (role === "student") {
      return NextResponse.redirect(new URL("/ogrenci", request.url));
    }
  }

  if (isStudentPanelPath(routingPathname)) {
    if (!hasPanelSession(request)) {
      return NextResponse.redirect(new URL("/giris", request.url));
    }
    const role = request.cookies.get(AUTH_ROLE_COOKIE)?.value?.trim();
    if (role === "coach") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
