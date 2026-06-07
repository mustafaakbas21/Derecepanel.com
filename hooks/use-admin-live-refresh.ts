"use client";

import { useEffect, useRef } from "react";

export const ADMIN_LIVE_REFRESH_MS = 8_000;

export type AdminRefreshOptions = {
  /** İlk yükleme dışında true — skeleton göstermemek için */
  silent: boolean;
};

/**
 * Admin panelinde veriyi periyodik yeniler; sekme gizliyken durur, geri gelince tetikler.
 */
export function useAdminLiveRefresh(
  refresh: (options: AdminRefreshOptions) => void | Promise<void>,
  options?: { intervalMs?: number; enabled?: boolean }
) {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  const intervalMs = options?.intervalMs ?? ADMIN_LIVE_REFRESH_MS;
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    if (!enabled) return;

    const run = (silent: boolean) => {
      if (document.hidden) return;
      void refreshRef.current({ silent });
    };

    const onVisible = () => run(true);
    document.addEventListener("visibilitychange", onVisible);
    const timer = window.setInterval(() => run(true), intervalMs);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, intervalMs]);
}
