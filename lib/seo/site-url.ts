/** Kanonik site kökü — sitemap, robots ve metadata için tek kaynak */
export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://derecepanel.com").replace(
    /\/$/,
    "",
  );
}
