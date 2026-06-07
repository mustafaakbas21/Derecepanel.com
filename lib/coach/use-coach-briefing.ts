"use client";

import { useCallback, useEffect, useState } from "react";

import { revalidateCoachDashboard } from "@/lib/coach/actions/revalidate-dashboard";
import type { OnyxCoachBriefingData } from "@/lib/coach/briefing-types";
import { collectCoachBriefingSync } from "@/lib/coach/collect-briefing-sync";
import { clientAuthHeaders } from "@/lib/auth/require-coach";

export function useCoachBriefing() {
  const [data, setData] = useState<OnyxCoachBriefingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sync = collectCoachBriefingSync();
      const res = await fetch("/api/coach/briefing", {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          ...clientAuthHeaders(),
        },
        body: JSON.stringify(sync),
      });
      const json = (await res.json()) as OnyxCoachBriefingData & {
        error?: string;
      };
      if (!res.ok) {
        throw new Error(json.error || "Brifing yüklenemedi.");
      }
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Brifing yüklenemedi.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await refresh();
    try {
      await revalidateCoachDashboard();
    } catch {
      /* sunucu revalidate opsiyonel */
    }
  }, [refresh]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onDataChange = () => {
      void refresh();
      void revalidateCoachDashboard().catch(() => {});
    };
    window.addEventListener("storage", onDataChange);
    window.addEventListener("appointments:change", onDataChange);
    window.addEventListener("examResults:change", onDataChange);
    window.addEventListener("students:change", onDataChange);
    return () => {
      window.removeEventListener("storage", onDataChange);
      window.removeEventListener("appointments:change", onDataChange);
      window.removeEventListener("examResults:change", onDataChange);
      window.removeEventListener("students:change", onDataChange);
    };
  }, [refresh]);

  return { data, loading, error, refresh: refreshAll };
}
