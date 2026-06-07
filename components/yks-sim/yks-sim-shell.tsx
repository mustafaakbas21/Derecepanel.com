"use client";

import { useYksSimAuth } from "@/hooks/use-yks-sim-auth";
import {
  OGRENCI_YKS_SIM_ROUTES,
  YKS_SIM_ROUTES,
} from "@/lib/coach/yks-sim-nav-config";

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  mode?: "coach" | "student";
};

export function YksSimShell({ title, subtitle, children, mode = "coach" }: Props) {
  const { ready, canAccess, denied, isStudent } = useYksSimAuth();

  if (!ready) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-slate-500">
        Yükleniyor…
      </div>
    );
  }

  if (denied || !canAccess) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
        <p className="font-semibold text-amber-900">Erişim gerekli</p>
        <p className="mt-2 text-sm text-amber-800">
          {isStudent
            ? "Öğrenci oturumu için currentUser tanımlı olmalıdır."
            : "Bu modüle yalnızca koç veya admin erişebilir."}
        </p>
      </div>
    );
  }

  return (
    <div className="yks-sim-page space-y-6" data-yks-sim-embed={mode === "student" ? "1" : undefined}>
      <header>
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
          YKS Simülasyon
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle ? (
          <p className="mt-1 max-w-2xl text-[15px] leading-relaxed text-slate-500">{subtitle}</p>
        ) : null}
      </header>

      {children}
    </div>
  );
}

export function coachTercihPath() {
  return YKS_SIM_ROUTES.tercih;
}

export function ogrenciTercihPath() {
  return OGRENCI_YKS_SIM_ROUTES.tercih;
}
