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
