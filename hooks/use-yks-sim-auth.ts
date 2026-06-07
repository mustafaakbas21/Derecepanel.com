"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getCachedAuthSession } from "@/lib/auth/local-auth";
import { getCurrentUser } from "@/lib/yks-sim/student-sim-bridge";

export type YksSimRole = "student" | "coach" | "admin" | "institution" | "";

export function readYksSimRole(): YksSimRole {
  if (typeof window === "undefined") return "";
  return (getCachedAuthSession()?.role || "coach") as YksSimRole;
}

export function useYksSimAuth(options?: { redirectTo?: string }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<YksSimRole>("");
  const [user, setUser] = useState<ReturnType<typeof getCurrentUser>>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    const r = readYksSimRole();
    setRole(r);

    if (r === "student") {
      const u = getCurrentUser();
      setUser(u);
      if (!u?.name && !u?.id && !u?.ogrenciId && !u?.studentCode) {
        setDenied(true);
        if (options?.redirectTo) router.replace(options.redirectTo);
      }
    } else if (r !== "coach" && r !== "admin" && r !== "institution") {
      setDenied(true);
    }

    setReady(true);
  }, [router, options?.redirectTo]);

  const isStudent = role === "student";
  const isStaff = role === "coach" || role === "admin" || role === "institution";

  return {
    ready,
    role,
    user,
    denied,
    isStudent,
    isStaff,
    canAccess: ready && !denied && (isStaff || (isStudent && !!user)),
  };
}
