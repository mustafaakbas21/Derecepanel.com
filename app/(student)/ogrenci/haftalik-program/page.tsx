import { Suspense } from "react";

import { StudentWeeklyProgramPage } from "@/components/student/student-weekly-program-page";

export default function OgrenciHaftalikProgramPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Yükleniyor…</p>}>
      <StudentWeeklyProgramPage />
    </Suspense>
  );
}
