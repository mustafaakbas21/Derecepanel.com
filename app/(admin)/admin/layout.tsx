"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { AdminInfoBanner } from "@/components/admin/admin-ui";
import { AdminTopNav } from "@/components/admin/admin-top-nav";
import { AuthGate } from "@/components/auth/auth-gate";
import { CoachScrollReset } from "@/components/coach/coach-scroll-reset";
import { isAdminLoginPath } from "@/lib/auth/local-auth";
import { setMaintenanceModeLocal } from "@/lib/admin/maintenance";
import { useAdminLiveRefresh } from "@/hooks/use-admin-live-refresh";

const MAIN_SCROLL_ID = "admin-main-scroll";

function AdminPanelShell({ children }: { children: React.ReactNode }) {
  const [maintenanceOn, setMaintenanceOn] = useState(false);

  const loadMaintenance = useCallback(({ silent }: { silent: boolean }) => {
    void fetch("/api/admin/maintenance", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { enabled?: boolean }) => {
        const enabled = Boolean(data.enabled);
        setMaintenanceOn(enabled);
        setMaintenanceModeLocal(enabled);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    loadMaintenance({ silent: false });
  }, [loadMaintenance]);

  useAdminLiveRefresh(loadMaintenance);

  return (
    <div className="dashboard-viewport">
      <div className="flex h-screen flex-col overflow-clip bg-[#F5F7FA]">
        <AdminTopNav />
        <main
          id={MAIN_SCROLL_ID}
          className="mx-auto min-h-0 w-full max-w-[1400px] flex-1 overflow-y-auto px-6 py-8"
        >
          {maintenanceOn ? (
            <AdminInfoBanner variant="warning">
              Bakım modu aktif — koç ve öğrenci girişi kapalı.
            </AdminInfoBanner>
          ) : null}
          <div className={maintenanceOn ? "mt-6" : undefined}>{children}</div>
        </main>
      </div>
      <CoachScrollReset targetId={MAIN_SCROLL_ID} />
    </div>
  );
}

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isLoginPage = isAdminLoginPath(pathname);

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <AuthGate role="admin">
      <AdminPanelShell>{children}</AdminPanelShell>
    </AuthGate>
  );
}
