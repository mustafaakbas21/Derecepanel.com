import type { MetadataRoute } from "next";

import { NOINDEX_PATH_PREFIXES } from "@/lib/seo/noindex-paths";
import { getSiteUrl } from "@/lib/seo/site-url";

/** App Router — `/robots.txt` olarak sunulur */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: NOINDEX_PATH_PREFIXES.map((prefix) => `${prefix}/`),
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
