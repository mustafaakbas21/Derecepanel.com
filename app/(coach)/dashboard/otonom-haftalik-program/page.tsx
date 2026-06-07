import { Suspense } from "react";

import { AutonomousWeeklyPlannerPage } from "@/components/weekly-planner/autonomous-weekly-planner-page";

export const metadata = {
  title: "Otonom Haftalık Program | DerecePanel",
  description:
    "MR analizlerinden üretilen AI tavsiyeleri ile akıllı haftalık çalışma planı oluşturun",
};

export default function OtonomHaftalikProgramRoute() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-slate-500">Yükleniyor…</div>}>
      <AutonomousWeeklyPlannerPage />
    </Suspense>
  );
}
