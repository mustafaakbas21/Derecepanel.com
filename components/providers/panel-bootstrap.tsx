"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import {
  fetchClientAuthSession,
  isAdminPortalClient,
} from "@/lib/auth/local-auth";
import { runCloudMigrationIfNeeded } from "@/lib/migration/cloud-migration";
import { clearPanelStoreCache, hydratePanelStore } from "@/lib/panel-store";

type PanelBootstrapProps = {
  children: ReactNode;
};

function isPublicMarketingPath(pathname: string): boolean {
  const onAdminPortal = isAdminPortalClient();
  if (onAdminPortal) {
    return pathname === "/giris" || pathname === "/admin/giris";
  }
  return (
    pathname === "/" ||
    pathname === "/giris" ||
    pathname === "/kurucu" ||
    pathname === "/admin/giris" ||
    pathname.startsWith("/sartlar") ||
    pathname.startsWith("/gizlilik")
  );
}

export function PanelBootstrap({ children }: PanelBootstrapProps) {
  const pathname = usePathname();
  const [ready, setReady] = useState(() => isPublicMarketingPath(pathname));

  useEffect(() => {
    if (isPublicMarketingPath(pathname)) {
      setReady(true);
      return;
    }

    let cancelled = false;

    async function boot() {
      try {
        const session = await fetchClientAuthSession();
        if (session) {
          await hydratePanelStore();
          void runCloudMigrationIfNeeded({
            coachId: session.userId,
            role: session.role,
          });
        } else {
          clearPanelStoreCache();
        }
      } catch {
        clearPanelStoreCache();
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
        Veriler yükleniyor…
      </div>
    );
  }

  return children;
}
