import fs from "node:fs";
import path from "node:path";

import { isNoIndexPath } from "@/lib/seo/noindex-paths";

const EXCLUDED_DIRS = new Set(["api"]);

function isDynamicSegment(name: string): boolean {
  return name.startsWith("[") && name.endsWith("]");
}

function isRouteGroup(name: string): boolean {
  return name.startsWith("(") && name.endsWith(")");
}

function isPageFile(name: string): boolean {
  return /^page\.(tsx|ts|jsx|js)$/.test(name);
}

/**
 * `app/` altındaki tüm statik `page` rotalarını dosya sisteminden toplar.
 * Route group `(admin)` URL'ye yansımaz; `[id]` gibi dinamik segmentler atlanır.
 */
export function collectAppRoutes(appDir = path.join(process.cwd(), "app")): string[] {
  const routes: string[] = [];

  function walk(dir: string, urlSegments: string[]): void {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    if (entries.some((entry) => entry.isFile() && isPageFile(entry.name))) {
      routes.push(urlSegments.length ? `/${urlSegments.join("/")}` : "/");
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      if (isDynamicSegment(entry.name)) continue;

      const nextSegments = isRouteGroup(entry.name)
        ? urlSegments
        : [...urlSegments, entry.name];

      walk(path.join(dir, entry.name), nextSegments);
    }
  }

  walk(appDir, []);
  return [...new Set(routes)]
    .filter((pathname) => !isNoIndexPath(pathname))
    .sort((a, b) => a.localeCompare(b, "tr"));
}

export function sitemapPriority(pathname: string): number {
  if (pathname === "/") return 1;
  if (pathname === "/giris" || pathname === "/gizlilik" || pathname === "/sartlar") {
    return 0.85;
  }
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/ogrenci")) {
    return 0.65;
  }
  return 0.7;
}

export function sitemapChangeFrequency(
  pathname: string,
): "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never" {
  if (pathname === "/") return "weekly";
  if (pathname === "/giris") return "monthly";
  return "monthly";
}
