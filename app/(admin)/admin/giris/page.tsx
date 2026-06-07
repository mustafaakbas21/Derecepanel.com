import { Suspense } from "react";

import { DereceLogo } from "@/components/coach/derece-logo";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
export default function AdminGirisPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="mb-8 flex flex-col items-center gap-2">
        <DereceLogo height={32} />
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Kurucu paneli
        </p>
      </div>
      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm">
        <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-slate-100" />}>
          <AdminLoginForm />
        </Suspense>
      </div>
    </div>
  );
}
