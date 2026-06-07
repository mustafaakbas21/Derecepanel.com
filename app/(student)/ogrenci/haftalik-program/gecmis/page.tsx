import { Suspense } from "react";

import { StudentWeeklyProgramHistoryPage } from "@/components/student/student-weekly-program-history-page";

export default function OgrenciHaftalikProgramGecmisPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Yükleniyor…</p>}>
      <StudentWeeklyProgramHistoryPage />
    </Suspense>
  );
}
