"use client";

import { useCallback, useEffect, useState } from "react";

import { KONU_TAKIP_CHANGED_EVENT, KONU_TAKIP_KEY } from "@/lib/konu-takip/constants";
import { loadStore } from "@/lib/konu-takip/storage";
import type { KonuTakipStore, StudentTracking } from "@/lib/konu-takip/types";

/**
 * Modül seviyesi bayrak: ilk SSR hydration tamamlanana kadar `false`.
 * Böylece ilk render sunucuyla aynı (boş) olur → hydration mismatch yok.
 */
let hasHydrated = false;

export function useKonuTakip() {
  const [store, setStore] = useState<KonuTakipStore>(() =>
    hasHydrated ? loadStore() : {}
  );
  const [hydrated, setHydrated] = useState(hasHydrated);

  const reload = useCallback(() => {
    setStore(loadStore());
    setHydrated(true);
  }, []);

  useEffect(() => {
    hasHydrated = true;
    reload();
    const onCustom = () => reload();
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === KONU_TAKIP_KEY) reload();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") reload();
    };
    window.addEventListener(KONU_TAKIP_CHANGED_EVENT, onCustom);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", reload);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener(KONU_TAKIP_CHANGED_EVENT, onCustom);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", reload);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [reload]);

  const trackingFor = useCallback(
    (studentId: string): StudentTracking => store[studentId] ?? {},
    [store]
  );

  return { store, hydrated, reload, trackingFor };
}
