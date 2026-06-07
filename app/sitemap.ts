import type { MetadataRoute } from "next";

import {
  collectAppRoutes,
  sitemapChangeFrequency,
  sitemapPriority,
} from "@/lib/seo/collect-app-routes";
import { getSiteUrl } from "@/lib/seo/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const routes = collectAppRoutes();

  return routes.map((pathname) => ({
    url: pathname === "/" ? siteUrl : `${siteUrl}${pathname}`,
    lastModified: new Date(),
    changeFrequency: sitemapChangeFrequency(pathname),
    priority: sitemapPriority(pathname),
  }));
}
