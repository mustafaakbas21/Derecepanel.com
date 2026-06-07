import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/seo/site-url";

/** App Router — `/robots.txt` olarak sunulur */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
