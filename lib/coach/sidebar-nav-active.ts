/** Sidebar aktif rota — en uzun eşleşen href kazanır (çakışan prefix önlenir) */

export type SubLinkActiveOpts = {
  /** Modül kökü (ör. /dashboard/test-maker) bu alt sayfaya yönlendiriyorsa */
  moduleRoot?: string;
  defaultChildHref?: string;
  /** Aynı gruptaki tüm alt link href'leri */
  siblingHrefs?: readonly string[];
};

function pathMatches(pathname: string, href: string): boolean {
  if (!href || href === "#") return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Üst menü (Ana Sayfa, Öğrenciler…) */
export function isCoachTopLinkActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathMatches(pathname, href);
}

/** Alt menü — kardeş linkler arasında en spesifik eşleşme */
export function isCoachSubLinkActive(
  pathname: string,
  href: string,
  opts?: SubLinkActiveOpts
): boolean {
  if (opts?.moduleRoot && pathname === opts.moduleRoot && opts.defaultChildHref === href) {
    return true;
  }

  const pool = opts?.siblingHrefs?.length
    ? [...opts.siblingHrefs]
    : [href];

  const matches = pool.filter((h) => pathMatches(pathname, h));
  if (!matches.length) return false;

  const best = matches.reduce((a, b) => (a.length >= b.length ? a : b));
  return best === href;
}
