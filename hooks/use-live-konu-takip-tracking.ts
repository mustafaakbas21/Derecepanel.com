"use client";

import { useMemo } from "react";

import { useKonuTakip } from "@/hooks/use-konu-takip";
import type { StudentTracking } from "@/lib/konu-takip/types";

/**
 * Konu Takip Merkezi store'una abone — Hata Karnesi vb. canlı rozetler.
 * `derece:konu-takip-changed`, storage ve sekme odağında yeniler.
 */
export function useLiveKonuTakipTracking(studentId: string) {
  const { trackingFor, hydrated, reload, store } = useKonuTakip();

  const tracking = useMemo((): StudentTracking => {
    const sid = String(studentId || "").trim();
    if (!sid) return {};
    return trackingFor(sid);
  }, [trackingFor, studentId, store]);

  return { tracking, hydrated, reload };
}
