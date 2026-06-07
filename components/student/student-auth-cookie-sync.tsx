"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { fetchClientAuthSession } from "@/lib/auth/local-auth";

/** Appwrite oturumunu doğrular; çerezler API login ile zaten ayarlanır */
export function StudentAuthCookieSync() {
  const router = useRouter();

  useEffect(() => {
    void fetchClientAuthSession().then((session) => {
      if (session?.role === "student") router.refresh();
    });
  }, [router]);

  return null;
}
