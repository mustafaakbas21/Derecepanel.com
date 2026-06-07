/** Arama motorlarında listelenmemesi gereken yol önekleri */
export const NOINDEX_PATH_PREFIXES = ["/admin", "/kurucu"] as const;

export function isNoIndexPath(pathname: string): boolean {
  return NOINDEX_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
