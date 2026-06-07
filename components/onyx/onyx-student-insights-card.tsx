"use client";

import Link from "next/link";
import { AlertCircle, BarChart3, Camera, ListChecks } from "lucide-react";

import { useStudentDashboardStats } from "@/lib/student/use-student-dashboard-stats";
import { STUDENT_KONU_TAKIP_ROUTES } from "@/lib/student/sidebar-nav-config";
import { cn } from "@/lib/utils";

export function OnyxStudentInsightsCard({ className }: { className?: string }) {
  const stats = useStudentDashboardStats();

  const { doneTopics, totalTopics } = stats.topicSummary;
  const weakCount = Math.max(0, totalTopics - doneTopics);

  return (
    <div
      className={cn(
        "grid w-full gap-3 sm:grid-cols-3",
        className
      )}
    >
      <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
        <div className="mb-2 flex items-center gap-2 text-slate-600">
          <Camera className="h-4 w-4 text-amber-500" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-wide">
            Bugün çözemediğim
          </span>
        </div>
        <p className="text-2xl font-bold text-slate-900">—</p>
        <p className="mt-1 text-xs text-slate-500">
          Soru fotoğrafı yükle; Onyx adım adım çözsün.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
        <div className="mb-2 flex items-center gap-2 text-slate-600">
          <BarChart3 className="h-4 w-4 text-slate-700" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-wide">
            Hızlı istatistik
          </span>
        </div>
        <p className="text-2xl font-bold text-slate-900">
          {stats.konuHydrated ? `%${stats.topicPercent}` : "…"}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Konu tamamlanma · {doneTopics}/{totalTopics} konu
        </p>
      </div>

      <Link
        href={STUDENT_KONU_TAKIP_ROUTES.durum}
        className="group rounded-2xl border border-amber-200/80 bg-amber-50/80 p-4 shadow-sm transition hover:border-amber-300 hover:bg-amber-50"
      >
        <div className="mb-2 flex items-center gap-2 text-amber-900">
          <AlertCircle className="h-4 w-4" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-wide">
            Tekrar gerekli
          </span>
        </div>
        <p className="text-2xl font-bold text-amber-950">
          {stats.konuHydrated ? weakCount : "…"}
        </p>
        <p className="mt-1 flex items-center gap-1 text-xs text-amber-800/90">
          <ListChecks className="h-3.5 w-3.5" aria-hidden />
          Konu Takip Merkezi →
        </p>
      </Link>
    </div>
  );
}
