"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { AutonomousWeeklyPlannerPage } from "@/components/weekly-planner/autonomous-weekly-planner-page";
import { useStudentKonuTakip } from "@/hooks/use-student-konu-takip";
import Link from "next/link";

export function StudentPersonalWeeklyPlannerPage() {
  const router = useRouter();
  const { user, hydrated, studentId } = useStudentKonuTakip();

  useEffect(() => {
    if (hydrated && !user) router.replace("/");
  }, [hydrated, user, router]);

  if (!hydrated) {
    return <p className="text-sm text-slate-500">Yükleniyor…</p>;
  }

  if (!user) {
    return (
      <p className="text-sm text-slate-500">
        Oturum bulunamadı.{" "}
        <Link href="/" className="font-medium text-slate-900 underline">
          Giriş sayfasına dön
        </Link>
      </p>
    );
  }

  if (!studentId) {
    return (
      <p className="text-sm text-slate-500">
        Öğrenci profili bulunamadı. Koç panelinde kayıtlı olduğunuzdan emin olun.
      </p>
    );
  }

  return <AutonomousWeeklyPlannerPage mode="student" />;
}
