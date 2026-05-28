import { DashboardSummaryCards } from "@/components/coach/dashboard-summary-cards";
import { ExamTransactionsTable } from "@/components/coach/exam-transactions-table";
import { StudentDistributionChart } from "@/components/coach/student-distribution-chart";
import { RecentActivities } from "@/components/coach/recent-activities";
import { YksCountdown } from "@/components/coach/yks-countdown";

export default function CoachDashboardPage() {
  return (
    <div className="space-y-5">
      <YksCountdown />

      {/* KPI row — 3 cards like NEXFI */}
      <DashboardSummaryCards />

      {/* Chart + activities — 2/3 + 1/3 */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <StudentDistributionChart />
        </div>
        <div className="lg:col-span-1">
          <RecentActivities />
        </div>
      </div>

      {/* Transactions table — full width */}
      <ExamTransactionsTable />
    </div>
  );
}
