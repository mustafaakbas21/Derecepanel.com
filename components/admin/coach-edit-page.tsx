"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { CoachForm } from "@/components/admin/coach-form";
import { refreshAdminPanelData } from "@/lib/admin/refresh-admin-panel";
import type { LocalCoachAccount } from "@/lib/auth/local-auth";

export function CoachEditPage() {
  const params = useParams();
  const coachId = String(params.coachId || "");
  const [coach, setCoach] = useState<LocalCoachAccount | null | undefined>(undefined);

  useEffect(() => {
    void (async () => {
      await refreshAdminPanelData();
      const res = await fetch("/api/admin/coaches", { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as {
        coaches?: LocalCoachAccount[];
      };
      const hit =
        data.coaches?.find((c) => c.coachId === coachId || c.id === coachId) ?? null;
      setCoach(hit);
    })();
  }, [coachId]);

  if (coach === undefined) {
    return <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />;
  }

  if (!coach) {
    return (
      <p className="text-sm text-slate-500">Koç bulunamadı.</p>
    );
  }

  return <CoachForm mode="edit" initial={coach} />;
}
