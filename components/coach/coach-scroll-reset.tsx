"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Rota değişince koç paneli içerik alanını (`<main>`) en üste sarar.
 * Özel scroll konteyneri (body değil) kullandığımız için Next'in varsayılan
 * scroll restorasyonu bu alana ulaşmaz; aşağı kaydırılmış bir sayfadan
 * geçişte yeni sayfanın tepeden başlamasını garanti eder.
 */
export function CoachScrollReset({ targetId }: { targetId: string }) {
  const pathname = usePathname();

  useEffect(() => {
    const el = document.getElementById(targetId);
    if (el) el.scrollTop = 0;
  }, [pathname, targetId]);

  return null;
}
