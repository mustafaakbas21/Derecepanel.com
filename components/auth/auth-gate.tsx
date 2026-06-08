"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import {
  fetchClientAuthSession,
  homePathForRole,
  isAdminLoginPath,
  loginPathForRole,
  type AuthRole,
} from "@/lib/auth/local-auth";

type AuthGateProps = {
  role: AuthRole;
  children: React.ReactNode;
};

const MAX_ATTEMPTS = 4;

export function AuthGate({ role, children }: AuthGateProps) {
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);
  const redirectingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function verify(attempt: number) {
      const session = await fetchClientAuthSession();
      if (cancelled || redirectingRef.current) return;

      if (session?.role === role) {
        setAllowed(true);
        return;
      }

      if (session) {
        redirectingRef.current = true;
        const dest =
          role === "admin" && session.role !== "admin"
            ? loginPathForRole("admin")
            : session.role === "admin"
              ? loginPathForRole("admin")
              : homePathForRole(session.role);
        if (dest !== pathname && !isAdminLoginPath(pathname)) {
          window.location.replace(dest);
        }
        return;
      }

      if (attempt < MAX_ATTEMPTS - 1) {
        await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
        if (!cancelled && !redirectingRef.current) await verify(attempt + 1);
        return;
      }

      redirectingRef.current = true;
      const next = encodeURIComponent(pathname || "/");
      window.location.replace(`${loginPathForRole(role)}?next=${next}`);
    }

    void verify(0);

    return () => {
      cancelled = true;
    };
  }, [role, pathname]);

  if (!allowed) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
        Oturum kontrol ediliyor…
      </div>
    );
  }

  return children;
}
