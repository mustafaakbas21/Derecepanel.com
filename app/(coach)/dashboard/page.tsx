import { DashboardChartsSection } from "@/components/coach/dashboard-charts-section";
import { OnyxCoachBriefing } from "@/components/coach/onyx-coach-briefing";
import { DashboardSummaryCards } from "@/components/coach/dashboard-summary-cards";
import { UpcomingExams } from "@/components/coach/upcoming-exams";
import { YksCountdown } from "@/components/coach/yks-countdown";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function CoachDashboardPage() {
  return (
    <div className="space-y-5">
      <YksCountdown />

      <DashboardSummaryCards />

      <OnyxCoachBriefing />

      <DashboardChartsSection />

      <UpcomingExams />
    </div>
  );
}
