import { Suspense } from "react";

import { StudentPersonalWeeklyPlannerPage } from "@/components/student/student-personal-weekly-planner-page";

export default function OgrenciBireyselHaftalikProgramPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Yükleniyor…</p>}>
      <StudentPersonalWeeklyPlannerPage />
    </Suspense>
  );
}
