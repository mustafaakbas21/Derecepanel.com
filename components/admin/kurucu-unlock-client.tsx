"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { ADMIN_UNLOCK_COOKIE } from "@/lib/admin/admin-portal";
import { ADMIN_ROUTES } from "@/lib/admin/admin-nav-config";

function setAdminUnlockCookie() {
  const maxAge = 60 * 60 * 24 * 7;
  document.cookie = `${ADMIN_UNLOCK_COOKIE}=1; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function KurucuUnlockClient() {
  const router = useRouter();

  useEffect(() => {
    setAdminUnlockCookie();
    router.replace(ADMIN_ROUTES.login);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
      Kurucu paneline yönlendiriliyor…
    </div>
  );
}
