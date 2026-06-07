import { Suspense } from "react";

import { YksCountdown } from "@/components/coach/yks-countdown";
import { StudentDashboardContent } from "@/components/student/student-dashboard-content";
import { StudentDashboardSkeleton } from "@/components/student/student-dashboard-skeleton";

export const metadata = {
  title: "Ana Sayfa | Öğrenci",
  description: "Onyx brifing, günlük görevler ve radar",
};

export default function OgrenciDashboardPage() {
  return (
    <div className="space-y-5">
      <YksCountdown />
      <Suspense fallback={<StudentDashboardSkeleton />}>
        <StudentDashboardContent />
      </Suspense>
    </div>
  );
}
