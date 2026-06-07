"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  fetchClientAuthSession,
  homePathForRole,
  type AuthRole,
} from "@/lib/auth/local-auth";

type AuthGateProps = {
  role: AuthRole;
  children: React.ReactNode;
};

export function AuthGate({ role, children }: AuthGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verify(attempt: number) {
      const session = await fetchClientAuthSession();
      if (cancelled) return;

      if (session?.role === role) {
        setAllowed(true);
        return;
      }
      if (session) {
        const dest =
          session.role === "admin" ? "/admin/giris" : homePathForRole(session.role);
        router.replace(dest);
        return;
      }

      // Giriş sonrası çerezler bazen ilk istekte henüz hazır olmaz
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 200));
        if (!cancelled) await verify(attempt + 1);
        return;
      }

      const next = encodeURIComponent(pathname || "/");
      const loginPath = role === "admin" ? "/admin/giris" : "/giris";
      router.replace(`${loginPath}?next=${next}`);
    }

    void verify(0);

    return () => {
      cancelled = true;
    };
  }, [role, router, pathname]);

  if (!allowed) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
        Oturum kontrol ediliyor…
      </div>
    );
  }

  return children;
}
