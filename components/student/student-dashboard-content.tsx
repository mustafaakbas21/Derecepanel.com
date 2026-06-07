import Link from "next/link";

import { StudentDashboardActions } from "@/components/student/student-dashboard-actions";
import { StudentDashboardHero } from "@/components/student/student-dashboard-hero";
import { StudentDailyTasks } from "@/components/student/student-daily-tasks";
import { getStudentSession } from "@/lib/auth/require-student";
import { buildStudentDashboard } from "@/lib/student/dashboard/build-dashboard";

export async function StudentDashboardContent() {
  const session = await getStudentSession();

  if (!session) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 text-center">
        <p className="text-sm text-amber-900">
          Oturum bilgisi sunucuya ulaşmadı. Sayfayı yenileyin veya tekrar
          giriş yapın.
        </p>
        <Link
          href="/giris?next=%2Fogrenci"
          className="mt-3 inline-block text-sm font-semibold text-slate-900 underline"
        >
          Giriş sayfasına git
        </Link>
      </div>
    );
  }

  const data = await buildStudentDashboard(session.studentId);

  return (
    <div className="space-y-5">
      <StudentDashboardHero data={data} />
      <div className="grid gap-4 lg:grid-cols-2">
        <StudentDailyTasks tasks={data.tasks} />
        <StudentDashboardActions exam={data.exam} />
      </div>
    </div>
  );
}
