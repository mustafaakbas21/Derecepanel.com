/** Kurucu paneli erişim çerezi — `/kurucu` ile set edilir */
export const ADMIN_UNLOCK_COOKIE = "dp_admin_unlock";

/**
 * Kurucu paneli erişimi:
 * - Geliştirme (koç ile aynı veri): `http://localhost:3000/kurucu`
 * - Paralel kurucu sunucusu: `npm run dev:admin` → genelde localhost:3001
 * - Üretim: admin.* host veya ADMIN_PORTAL=1
 */
export function isAdminOnlyServer(): boolean {
  return process.env.ADMIN_PORTAL === "1";
}

export function isAdminHost(host: string): boolean {
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  return hostname === "admin.localhost" || hostname.startsWith("admin.");
}

/** Koç/öğrenci paneli — admin subdomain'de /admin altına rewrite edilmez */
export function isCoachOrStudentPanelPath(pathname: string): boolean {
  return (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/ogrenci" ||
    pathname.startsWith("/ogrenci/")
  );
}

/**
 * admin.derecepanel.com (veya admin.localhost) isteklerini /admin/* iç rotaya map eder.
 * Zaten /admin ile başlıyorsa veya koç/öğrenci paneli yoluysa null döner.
 */
export function resolveAdminSubdomainRewritePath(pathname: string): string | null {
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    isCoachOrStudentPanelPath(pathname) ||
    /\.[a-z0-9]+$/i.test(pathname)
  ) {
    return null;
  }
  if (pathname === "/") return "/admin";
  return `/admin${pathname}`;
}

export function hasAdminUnlockCookie(cookieValue: string | undefined): boolean {
  return cookieValue === "1";
}

export function canAccessAdminRoutes(opts: {
  host: string;
  unlockCookie?: string;
}): boolean {
  if (isAdminOnlyServer()) return true;
  if (isAdminHost(opts.host)) return true;
  if (hasAdminUnlockCookie(opts.unlockCookie)) return true;
  return false;
}
