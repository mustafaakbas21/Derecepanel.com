import path from "node:path";

import type { NextConfig } from "next";

/** Yalnızca yerel `dev:admin` için ayrı cache; Vercel üretim build'i her zaman `.next` kullanır. */
const isAdminDev =
  process.env.ADMIN_PORTAL === "1" &&
  process.env.NODE_ENV === "development";

const withBundleAnalyzer =
  process.env.ANALYZE === "true"
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("@next/bundle-analyzer")({ enabled: true })
    : (config: NextConfig) => config;

const ADMIN_SUBDOMAIN_HOSTS = ["admin.derecepanel.com", "admin.localhost"] as const;
const MAIN_SITE_HOSTS = ["derecepanel.com", "www.derecepanel.com"] as const;

type HostRule = { type: "host"; value: string };
type RewriteRule = {
  source: string;
  has: HostRule[];
  destination: string;
};
type RedirectRule = RewriteRule & { permanent: boolean };

function adminSubdomainRewrites(): RewriteRule[] {
  const rules: RewriteRule[] = [];
  for (const host of ADMIN_SUBDOMAIN_HOSTS) {
    rules.push(
      {
        source: "/",
        has: [{ type: "host", value: host }],
        destination: "/admin",
      },
      {
        source:
          "/:path((?!admin|dashboard|ogrenci|_next|api|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)",
        has: [{ type: "host", value: host }],
        destination: "/admin/:path",
      }
    );
  }
  return rules;
}

function mainSiteAdminRedirects(): RedirectRule[] {
  const rules: RedirectRule[] = [];
  for (const host of MAIN_SITE_HOSTS) {
    rules.push(
      {
        source: "/admin",
        has: [{ type: "host", value: host }],
        destination: "https://admin.derecepanel.com",
        permanent: false,
      },
      {
        source: "/admin/:path*",
        has: [{ type: "host", value: host }],
        destination: "https://admin.derecepanel.com/:path*",
        permanent: false,
      }
    );
  }
  return rules;
}

const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  /** `npm run dev:admin` — ana dev ile paralel çalışır (ayrı lock) */
  distDir: isAdminDev ? ".next-admin" : ".next",
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: adminSubdomainRewrites(),
    };
  },
  async redirects() {
    return mainSiteAdminRedirects();
  },
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "@radix-ui/react-dialog",
      "@radix-ui/react-select",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-tabs",
      "@radix-ui/react-avatar",
    ],
  },
};

export default withBundleAnalyzer(nextConfig);
