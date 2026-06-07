import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  ADMIN_UNLOCK_COOKIE,
  canAccessAdminRoutes,
  isAdminOnlyServer,
} from "@/lib/admin/admin-portal";
import { isMaintenanceModeServer } from "@/lib/admin/maintenance-server";
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

function isStaticOrApi(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    /\.[a-z0-9]+$/i.test(pathname)
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isStaticOrApi(pathname) || isKurucuUnlockPath(pathname)) {
    return NextResponse.next();
  }

  let maintenance = false;
  try {
    maintenance = await isMaintenanceModeServer();
  } catch {
    maintenance = false;
  }
  if (maintenance) {
    const role = request.cookies.get(AUTH_ROLE_COOKIE)?.value;
    if (role !== "admin") {
      const isGiris = pathname === "/giris";
      const isPanel =
        pathname.startsWith("/dashboard") || pathname.startsWith("/ogrenci");

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

  const host = request.headers.get("host") ?? "";
  const unlockCookie = request.cookies.get(ADMIN_UNLOCK_COOKIE)?.value;
  const adminAccess = canAccessAdminRoutes({ host, unlockCookie });
  const adminOnly = isAdminOnlyServer();

  if (adminOnly) {
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/admin/giris", request.url));
    }

    if (
      pathname === "/giris" ||
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/ogrenci")
    ) {
      return NextResponse.redirect(new URL("/admin/giris", request.url));
    }

    if (!isAdminPath(pathname)) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    return NextResponse.next();
  }

  if (isAdminPath(pathname) && !adminAccess && !isPublicAdminPath(pathname)) {
    const authRole = request.cookies.get(AUTH_ROLE_COOKIE)?.value?.trim();
    const hasAdminSession =
      authRole === "admin" && Boolean(request.cookies.get(DP_SESSION_COOKIE)?.value);
    if (!hasAdminSession) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
