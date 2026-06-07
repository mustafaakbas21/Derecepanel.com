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

const nextConfig: NextConfig = {
  /** `npm run dev:admin` — ana dev ile paralel çalışır (ayrı lock) */
  distDir: isAdminDev ? ".next-admin" : ".next",
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
